'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Loader2, Search, UserCheck, X, ImagePlus,
  BookOpen, Feather, Star, Music, Sprout, Home, Layers, FileText,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Types ──────────────────────────────────────────────────────────────────
interface Vendor { _id: string; name: string; email: string; image?: string; }

const ALLOWED_TYPES = [
  'Langue amazigh',
  'Événements & traditions',
  'Symboles et motifs berbères',
  'Musique amazigh',
  'Patrimoine et Traditions',
  'Agriculture amazigh',
  'Architecture amazigh',
  'Documentation',
] as const;

type CultureType = typeof ALLOWED_TYPES[number];

const TYPE_ICONS: Record<CultureType, React.ReactNode> = {
  'Langue amazigh':             <Feather size={14} />,
  'Événements & traditions':    <Star size={14} />,
  'Symboles et motifs berbères':<Layers size={14} />,
  'Musique amazigh':            <Music size={14} />,
  'Patrimoine et Traditions':   <Home size={14} />,
  'Agriculture amazigh':        <Sprout size={14} />,
  'Architecture amazigh':       <BookOpen size={14} />,
  'Documentation':              <FileText size={14} />,
};

interface FormState {
  Auteur: string;      // display author name (free text)
  title: string;
  description: string;
  type: CultureType | '';
}

interface FieldError {
  title?: string;
  description?: string;
  type?: string;
  vendor?: string;
}

// ── Preset tags ────────────────────────────────────────────────────────────
const PRESET_TAGS = [
  'Tifinagh', 'Oral', 'Manuscrit', 'Artisanat', 'Tatouage',
  'Textile', 'Céramique', 'Poésie', 'Chant', 'Danse',
  'Rite', 'Gastronomie', 'Architecture', 'Bijou',
];

// ── Validation ─────────────────────────────────────────────────────────────
function validate(form: FormState, mode: 'admin' | 'vendor', vendorId: string): FieldError {
  const errors: FieldError = {};
  if (!form.title.trim())       errors.title       = 'Le titre est requis.';
  if (!form.description.trim()) errors.description = 'La description est requise.';
  if (!form.type)               errors.type        = 'Le type est requis.';
  if (mode === 'vendor' && !vendorId) errors.vendor = 'Veuillez sélectionner un auteur.';
  return errors;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function AdminCreateCulturePage() {
  const router   = useRouter();
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  // "admin"  → admin publishes as himself  → POST /admin/create
  // "vendor" → admin publishes for vendor  → POST /admin/for-vendor
  const [mode, setMode] = useState<'admin' | 'vendor'>('admin');

  const [form, setForm] = useState<FormState>({ Auteur: '', title: '', description: '', type: '' });
  const [tags, setTags]           = useState<string[]>([]);
  const [tagInput, setTagInput]   = useState('');
  const [images, setImages]       = useState<File[]>([]);
  const [previews, setPreviews]   = useState<string[]>([]);
  const [errors, setErrors]       = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Vendor search (only used in vendor mode) ──────────────────────────────
  const [vendorEmail, setVendorEmail]         = useState('');
  const [vendorResults, setVendorResults]     = useState<Vendor[]>([]);
  const [vendorSearching, setVendorSearching] = useState(false);
  const [selectedVendor, setSelectedVendor]   = useState<Vendor | null>(null);
  const vendorDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mode !== 'vendor') return;
    if (vendorDebounce.current) clearTimeout(vendorDebounce.current);
    if (!vendorEmail.trim()) { setVendorResults([]); return; }
    vendorDebounce.current = setTimeout(async () => {
      setVendorSearching(true);
      try {
        const res = await fetch(
          `${API}/api/users?role=vendor&search=${encodeURIComponent(vendorEmail)}&limit=6`,
          { headers: { Authorization: `Bearer ${apiToken}` } }
        );
        const data = await res.json();
        setVendorResults(data.users ?? []);
      } catch { setVendorResults([]); }
      finally { setVendorSearching(false); }
    }, 350);
  }, [vendorEmail, apiToken, mode]);

  const pickVendor = (v: Vendor) => {
    setSelectedVendor(v);
    setVendorEmail(v.email);
    setVendorResults([]);
    setErrors(p => ({ ...p, vendor: undefined }));
  };
  const clearVendor = () => { setSelectedVendor(null); setVendorEmail(''); setVendorResults([]); };

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(p => ({ ...p, [name]: undefined }));
  };

  // ── Tag helpers ───────────────────────────────────────────────────────────
  const toggleTag = (t: string) =>
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const addCustomTag = () => {
    const v = tagInput.trim();
    if (v && !tags.includes(v)) setTags(prev => [...prev, v]);
    setTagInput('');
  };
  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  // ── Image helpers ─────────────────────────────────────────────────────────
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 8 - images.length);
    setImages(prev   => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
  };
  const removeImage = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setImages(prev   => prev.filter((_, j) => j !== i));
    setPreviews(prev => prev.filter((_, j) => j !== i));
  };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = async () => {
    const errs = validate(form, mode, selectedVendor?._id ?? '');
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      setSubmitting(true);
      setServerError(null);

      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) body.append(k, v); });
      tags.forEach(t => body.append('amenities', t));
      images.forEach(img => body.append('images', img));

      // Decide endpoint based on mode
      let endpoint = '';
      if (mode === 'admin') {
        endpoint = `${API}/api/culture-amazigh/admin/create`;
      } else {
        body.append('hostId', selectedVendor!._id);
        endpoint = `${API}/api/culture-amazigh/admin/for-vendor`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiToken}` },
        body,
      });

      if (res.status === 401) throw new Error('Non autorisé — session expirée ?');
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message ?? `Erreur ${res.status}`);
      }
      router.push('/dashboard/admin/cultureamazigh');
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="mh-page-header mh-anim-fade-up">
        <div>
          <Link href="/dashboard/admin/cultureamazigh" className="mh-page-back">
            ← Retour aux publications
          </Link>
          <h1 className="mh-page-title">Nouvelle Publication</h1>
          <p className="mh-page-subtitle">Créez une publication culturelle amazigh</p>
        </div>
      </div>

      {serverError && (
        <div className="mh-alert mh-alert-error">
          <X size={15} /> {serverError}
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); submit(); }} noValidate>
        <div className="mh-create-grid">

          {/* ── LEFT ─────────────────────────────────────────────────────── */}
          <div className="mh-create-main">

            {/* General info */}
            <div className="mh-card mh-anim-fade-up mh-anim-d1">
              <div className="mh-card-header">
                <h2 className="mh-card-title"><BookOpen size={16} /> Informations générales</h2>
              </div>
              <div className="mh-card-body">

                {/* Title */}
                <div className="mh-form-group">
                  <label className="mh-form-label">Titre de la publication *</label>
                  <input
                    name="title" value={form.title} onChange={handle}
                    className={`mh-form-input${errors.title ? ' error' : ''}`}
                    placeholder="Ex: Les inscriptions Tifinagh de Tazina"
                  />
                  {errors.title && <span className="mh-form-error">{errors.title}</span>}
                </div>

                {/* Auteur */}
                <div className="mh-form-group">
                  <label className="mh-form-label">
                    Auteur <span className="mh-form-hint">nom affiché publiquement</span>
                  </label>
                  <input
                    name="Auteur" value={form.Auteur} onChange={handle}
                    className="mh-form-input"
                    placeholder="Ex: Dr. Amayas Oufella"
                  />
                </div>

                {/* Type */}
                <div className="mh-form-group">
                  <label className="mh-form-label">Type de publication *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                    {ALLOWED_TYPES.map(t => (
                      <button
                        key={t} type="button"
                        onClick={() => { setForm(f => ({ ...f, type: t })); setErrors(p => ({ ...p, type: undefined })); }}
                        style={{
                          padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                          border: `2px solid ${form.type === t ? '#7C3AED' : '#E2E8F0'}`,
                          background: form.type === t ? '#F5F3FF' : '#fff',
                          display: 'flex', alignItems: 'center', gap: 7,
                          fontWeight: form.type === t ? 650 : 400,
                          fontSize: '0.82rem',
                          color: form.type === t ? '#7C3AED' : '#4A5568',
                          transition: 'all 0.18s', textAlign: 'left',
                        }}
                      >
                        <span style={{ color: form.type === t ? '#7C3AED' : '#8B9AB5', flexShrink: 0 }}>
                          {TYPE_ICONS[t]}
                        </span>
                        {t}
                      </button>
                    ))}
                  </div>
                  {errors.type && <span className="mh-form-error">{errors.type}</span>}
                </div>

                {/* Description */}
                <div className="mh-form-group">
                  <label className="mh-form-label">Description *</label>
                  <textarea
                    name="description" value={form.description} onChange={handle}
                    className={`mh-form-textarea${errors.description ? ' error' : ''}`}
                    rows={6}
                    placeholder="Décrivez le contenu, son contexte historique et sa signification culturelle…"
                  />
                  {errors.description && <span className="mh-form-error">{errors.description}</span>}
                </div>

              </div>
            </div>

            {/* Tags */}
            <div className="mh-card mh-anim-fade-up mh-anim-d2">
              <div className="mh-card-header">
                <h2 className="mh-card-title">Mots-clés & Thématiques</h2>
                <span className="mh-card-hint">{tags.length} sélectionné(s)</span>
              </div>
              <div className="mh-card-body">
                <div className="mh-amenity-wrap">
                  {PRESET_TAGS.map(t => (
                    <button key={t} type="button"
                      className={`mh-amenity-tag${tags.includes(t) ? ' selected' : ''}`}
                      onClick={() => toggleTag(t)}
                    >
                      {tags.includes(t) && <span>✓</span>} {t}
                    </button>
                  ))}
                </div>
                <div className="mh-amenity-add-wrap">
                  <input
                    className="mh-amenity-add-input" value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
                    placeholder="Ajouter un mot-clé personnalisé…"
                  />
                  <button type="button" className="mh-amenity-add-btn" onClick={addCustomTag}>
                    + Ajouter
                  </button>
                </div>
                {tags.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {tags.map(t => (
                      <span key={t} className="mh-amenity-tag removable" onClick={() => removeTag(t)}>
                        {t} <X size={11} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Images */}
            <div className="mh-card mh-anim-fade-up mh-anim-d3">
              <div className="mh-card-header">
                <h2 className="mh-card-title">Photos & Médias</h2>
                <span className="mh-card-hint">{images.length}/8</span>
              </div>
              <div className="mh-card-body">
                {images.length < 8 && (
                  <div
                    className="mh-drop-zone"
                    onDragOver={e => e.preventDefault()} onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
                  >
                    <ImagePlus size={28} style={{ margin: '0 auto .6rem', opacity: 0.4 }} />
                    <p className="mh-drop-zone-text">
                      Glissez des images ici ou <strong>cliquez pour choisir</strong>
                    </p>
                    <input ref={fileRef} type="file" accept="image/*" multiple
                      style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
                  </div>
                )}
                {previews.length > 0 && (
                  <div className="mh-image-grid">
                    {previews.map((src, i) => (
                      <div key={src} className="mh-image-thumb">
                        <img src={src} alt={`preview-${i}`} />
                        <button type="button" className="mh-image-thumb-remove" onClick={() => removeImage(i)}>
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── RIGHT ────────────────────────────────────────────────────── */}
          <div className="mh-create-side">

            {/* Publication mode */}
            <div className="mh-card mh-anim-fade-up mh-anim-d1">
              <div className="mh-card-header">
                <h2 className="mh-card-title">Mode de publication</h2>
              </div>
              <div className="mh-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Admin publishes as himself */}
                <button
                  type="button"
                  onClick={() => { setMode('admin'); setSelectedVendor(null); setVendorEmail(''); setErrors(p => ({ ...p, vendor: undefined })); }}
                  style={{
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${mode === 'admin' ? '#7C3AED' : '#E2E8F0'}`,
                    background: mode === 'admin' ? '#F5F3FF' : '#fff',
                    transition: 'all 0.18s',
                  }}
                >
                  <div style={{ fontWeight: 650, color: mode === 'admin' ? '#7C3AED' : '#2D3748', fontSize: '0.875rem' }}>
                    🧑‍💼 Publier en tant qu'admin
                  </div>
                  <div style={{ fontSize: '0.77rem', color: '#8B9AB5', marginTop: 3 }}>
                    Vous êtes l'auteur — publication auto-approuvée
                  </div>
                </button>

                {/* Admin publishes for a vendor */}
                <button
                  type="button"
                  onClick={() => setMode('vendor')}
                  style={{
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${mode === 'vendor' ? '#0B9E5E' : '#E2E8F0'}`,
                    background: mode === 'vendor' ? '#F0FDF4' : '#fff',
                    transition: 'all 0.18s',
                  }}
                >
                  <div style={{ fontWeight: 650, color: mode === 'vendor' ? '#0B9E5E' : '#2D3748', fontSize: '0.875rem' }}>
                    👤 Publier pour un vendeur
                  </div>
                  <div style={{ fontSize: '0.77rem', color: '#8B9AB5', marginTop: 3 }}>
                    Associe la publication à un compte vendeur existant
                  </div>
                </button>
              </div>
            </div>

            {/* Vendor search — only visible in vendor mode */}
            {mode === 'vendor' && (
              <div className="mh-card mh-anim-fade-up">
                <div className="mh-card-header">
                  <h2 className="mh-card-title">Vendeur *</h2>
                  {selectedVendor && (
                    <span className="mh-badge mh-badge-success" style={{ fontSize: '0.7rem' }}>Sélectionné</span>
                  )}
                </div>
                <div className="mh-card-body">
                  <div className="mh-form-group">
                    <label className="mh-form-label">Rechercher par email</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Search size={15} style={{ position: 'absolute', left: 12, color: '#8B9AB5', pointerEvents: 'none' }} />
                      <input
                        type="email" value={vendorEmail}
                        onChange={e => { setVendorEmail(e.target.value); if (selectedVendor) setSelectedVendor(null); setErrors(p => ({ ...p, vendor: undefined })); }}
                        className={`mh-form-input${errors.vendor ? ' error' : ''}`}
                        style={{ paddingLeft: 36, paddingRight: selectedVendor ? 36 : 12 }}
                        placeholder="vendeur@email.com"
                        autoComplete="off"
                      />
                      {vendorSearching
                        ? <Loader2 size={14} style={{ position: 'absolute', right: 12, color: '#8B9AB5' }} className="mh-spin" />
                        : selectedVendor
                        ? <button type="button" onClick={clearVendor} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#8B9AB5', padding: 0, display: 'flex', alignItems: 'center' }}><X size={14} /></button>
                        : null}
                    </div>
                    {errors.vendor && <span className="mh-form-error">{errors.vendor}</span>}
                  </div>

                  {vendorResults.length > 0 && (
                    <div className="mh-vendor-results">
                      {vendorResults.map(v => (
                        <button key={v._id} type="button" className="mh-vendor-result-item" onClick={() => pickVendor(v)}>
                          <div className="mh-vendor-avatar">
                            {v.image ? <img src={v.image} alt={v.name} /> : v.name[0].toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="mh-vendor-name">{v.name}</div>
                            <div className="mh-vendor-email">{v.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedVendor && (
                    <div className="mh-vendor-selected">
                      <UserCheck size={16} style={{ color: '#0B9E5E', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div className="mh-vendor-name">{selectedVendor.name}</div>
                        <div className="mh-vendor-email">{selectedVendor.email}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="mh-tips-card mh-anim-fade-up mh-anim-d2">
              <div className="mh-tips-icon">🪬</div>
              <div className="mh-tips-title">Conseils pour une bonne publication</div>
              <ul className="mh-tips-list">
                <li>Titre précis et évocateur</li>
                <li>Contexte historique documenté</li>
                <li>Images de qualité, haute résolution</li>
                <li>Mots-clés pertinents pour la recherche</li>
                <li>Description en français et/ou tamazight</li>
              </ul>
            </div>

            {/* Type preview */}
            {form.type && (
              <div className="mh-card mh-anim-fade-up" style={{ border: '1.5px solid #7C3AED22' }}>
                <div className="mh-card-body" style={{ paddingTop: 14, paddingBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED', flexShrink: 0 }}>
                      {TYPE_ICONS[form.type as CultureType]}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#8B9AB5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type sélectionné</div>
                      <div style={{ fontWeight: 650, color: '#7C3AED', fontSize: '0.875rem' }}>{form.type}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="mh-anim-fade-up mh-anim-d4">
              <button
                type="submit" className="mh-publish-btn" disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {submitting
                  ? <><Loader2 size={16} className="mh-spin" /> Publication…</>
                  : mode === 'admin'
                  ? '✦ Publier en tant qu\'admin'
                  : '✦ Publier pour le vendeur'}
              </button>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}