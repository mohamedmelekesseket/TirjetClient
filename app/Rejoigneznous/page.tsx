"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const specialites = [
  "Tissage & Tapis",
  "Poterie & Céramique",
  "Bijouterie & Argent",
  "Broderie & Couture",
  "Maroquinerie",
  "Sculpture sur bois",
  "Calligraphie",
  "Autre",
];

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export default function RejoindrePage() {
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [values, setValues] = useState({
    nom: "",
    email: "",
    telephone: "",
    ville: "",
    specialite: "",
    histoire: "",
  });

  const [heroIn, setHeroIn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHeroIn(true), 80);
    return () => clearTimeout(t);
  }, []);

  const formSect = useInView(0.05);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    setApiError(null);
    setSubmitting(true);

    try {
      // Build FormData so images can be added later if needed
      const formData = new FormData();
      formData.append("phone", values.telephone);
      formData.append("region", values.ville);
      formData.append("specialite", values.specialite);
      formData.append("description", values.histoire);

      const headers: HeadersInit = {};
      if (apiToken) headers["Authorization"] = `Bearer ${apiToken}`;
      // ⚠️ Do NOT set Content-Type — browser sets it with boundary for FormData

      const res = await fetch(`${API}/api/artisans/apply`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // "already submitted" or server error
        throw new Error(data.message || "Erreur lors de l'envoi");
      }

      setSubmitted(true);
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filled = (name: string) =>
    values[name as keyof typeof values].length > 0;

  return (
    <div className="rj-page">
      <a href="/" className="lp-right__home" aria-label="Retour à l'accueil">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
          <path d="M9 21V12h6v9" />
        </svg>
      </a>

      <section className="rj-form-section" ref={formSect.ref}>
        <div className={`rj-form-wrap${formSect.visible ? " rj-form-wrap--in" : ""}`}>

          {/* Left panel */}
          <aside className="rj-form-aside">
            <p className="rj-eyebrow rj-eyebrow--gold">VOTRE CANDIDATURE</p>
            <h2 className="rj-aside__title">Devenez<br /><em>artisan partenaire</em></h2>
            <p className="rj-aside__desc">
              Remplissez ce formulaire et notre équipe vous contactera
              sous 48h pour discuter de votre intégration sur la plateforme.
            </p>
            <div className="rj-aside__steps">
              {[
                { n: "01", t: "Candidature", d: "Remplissez ce formulaire" },
                { n: "02", t: "Entretien",   d: "Échange avec notre équipe" },
                { n: "03", t: "Boutique",    d: "Mise en ligne de vos créations" },
              ].map((s) => (
                <div key={s.n} className="rj-step">
                  <span className="rj-step__num">{s.n}</span>
                  <div>
                    <strong className="rj-step__title">{s.t}</strong>
                    <p className="rj-step__desc">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rj-aside__img-wrap">
              <img
                src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80"
                alt="Artisan au travail"
              />
            </div>
          </aside>

          {/* Form card */}
          <div className="rj-form-card">
            {submitted ? (
              <div className="rj-success">
                <div className="rj-success__icon" aria-hidden="true">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="rj-success__title">Candidature envoyée !</h3>
                <p className="rj-success__desc">
                  Merci {values.nom.split(" ")[0]}. Notre équipe vous contactera
                  sous 48h à l'adresse <strong>{values.email}</strong>.
                </p>
                <button
                  className="rj-btn rj-btn--gold"
                  onClick={() => { setSubmitted(false); setValues({ nom: "", email: "", telephone: "", ville: "", specialite: "", histoire: "" }); }}
                >
                  Nouvelle candidature
                </button>
              </div>
            ) : (
              <>
                <div className="rj-form-header">
                  <p className="rj-eyebrow">INFORMATIONS</p>
                  <h3 className="rj-form-title">Votre profil artisan</h3>
                </div>

                {/* ✅ API error banner */}
                {apiError && (
                  <div style={{
                    background: "#FFF5F5", border: "1px solid #FEB2B2",
                    color: "#C53030", borderRadius: "8px",
                    padding: "12px 16px", marginBottom: "16px", fontSize: "0.875rem"
                  }}>
                    {apiError}
                  </div>
                )}

                <div className="rj-fields">
                  {/* Row 1 — Nom + Email */}
                  <div className="rj-row">
                    <div className={`rj-field${focused === "nom" ? " rj-field--focus" : ""}${filled("nom") ? " rj-field--filled" : ""}`}>
                      <label className="rj-label" htmlFor="nom">Nom complet</label>
                      <input id="nom" name="nom" type="text" className="rj-input"
                        placeholder="Fatma Ben Amor" value={values.nom}
                        onChange={handleChange} onFocus={() => setFocused("nom")} onBlur={() => setFocused(null)} />
                      <span className="rj-field__line" />
                    </div>
                    <div className={`rj-field${focused === "email" ? " rj-field--focus" : ""}${filled("email") ? " rj-field--filled" : ""}`}>
                      <label className="rj-label" htmlFor="email">Adresse email</label>
                      <input id="email" name="email" type="email" className="rj-input"
                        placeholder="fatma@exemple.com" value={values.email}
                        onChange={handleChange} onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} />
                      <span className="rj-field__line" />
                    </div>
                  </div>

                  {/* Row 2 — Téléphone + Ville */}
                  <div className="rj-row">
                    <div className={`rj-field${focused === "telephone" ? " rj-field--focus" : ""}${filled("telephone") ? " rj-field--filled" : ""}`}>
                      <label className="rj-label" htmlFor="telephone">Téléphone</label>
                      <input id="telephone" name="telephone" type="tel" className="rj-input"
                        placeholder="+216 00 000 000" value={values.telephone}
                        onChange={handleChange} onFocus={() => setFocused("telephone")} onBlur={() => setFocused(null)} />
                      <span className="rj-field__line" />
                    </div>
                    <div className={`rj-field${focused === "ville" ? " rj-field--focus" : ""}${filled("ville") ? " rj-field--filled" : ""}`}>
                      <label className="rj-label" htmlFor="ville">Ville / Région</label>
                      <input id="ville" name="ville" type="text" className="rj-input"
                        placeholder="Gafsa, Sejnane, Matmata" value={values.ville}
                        onChange={handleChange} onFocus={() => setFocused("ville")} onBlur={() => setFocused(null)} />
                      <span className="rj-field__line" />
                    </div>
                  </div>

                  {/* Spécialité */}
                  <div className={`rj-field rj-field--full${focused === "specialite" ? " rj-field--focus" : ""}${filled("specialite") ? " rj-field--filled" : ""}`}>
                    <label className="rj-label" htmlFor="specialite">Spécialité</label>
                    <select id="specialite" name="specialite" className="rj-select"
                      value={values.specialite} onChange={handleChange}
                      onFocus={() => setFocused("specialite")} onBlur={() => setFocused(null)}>
                      <option value="" disabled>Choisissez votre spécialité…</option>
                      {specialites.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span className="rj-select__arrow">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="rj-field__line" />
                  </div>

                  {/* Histoire */}
                  <div className={`rj-field rj-field--full rj-field--textarea${focused === "histoire" ? " rj-field--focus" : ""}${filled("histoire") ? " rj-field--filled" : ""}`}>
                    <label className="rj-label" htmlFor="histoire">Votre histoire</label>
                    <textarea id="histoire" name="histoire" className="rj-textarea" rows={6}
                      placeholder="Racontez-nous votre parcours, votre inspiration, ce qui rend votre travail unique…"
                      value={values.histoire} onChange={handleChange}
                      onFocus={() => setFocused("histoire")} onBlur={() => setFocused(null)} />
                    <span className="rj-field__line" />
                    <span className="rj-char-count">{values.histoire.length} / 600</span>
                  </div>
                </div>

                <div className="rj-form-footer">
                  <p className="rj-form-legal">
                    En soumettant ce formulaire, vous acceptez nos{" "}
                    <Link href="/apropos">conditions d&apos;utilisation</Link>.
                  </p>
                  <button
                    className="rj-btn rj-btn--gold"
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{ opacity: submitting ? 0.7 : 1 }}
                  >
                    {submitting ? "Envoi en cours…" : "Envoyer ma candidature →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}