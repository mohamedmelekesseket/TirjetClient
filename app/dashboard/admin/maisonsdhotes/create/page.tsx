'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Loader2, Search, UserCheck, X, ImagePlus, MapPin,
  Phone, Globe, Moon, Leaf, Building2,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Types ──────────────────────────────────────────────────────────────────
interface Vendor { _id: string; name: string; email: string; image?: string; }

interface FormState {
  name: string;
  description: string;
  type: 'traditionnelle' | 'moderne' | '';
  location: string;
  region: string;
  governorate: string;
  tag: string;
  pricePerNight: string;
  currency: string;
  minNights: string;
  phone: string;
  website: string;
}

interface FieldError {
  name?: string;
  description?: string;
  type?: string;
  location?: string;
  pricePerNight?: string;
  vendor?: string;
}

// ── Preset amenities ───────────────────────────────────────────────────────
const PRESET_AMENITIES = [
  'WiFi', 'Parking', 'Piscine', 'Climatisation', 'Chauffage',
  'Cuisine équipée', 'Petit-déjeuner inclus', 'Jardin', 'Terrasse',
  'Vue sur mer', 'Animaux acceptés', 'Accessible PMR',
];

// ── Validation ─────────────────────────────────────────────────────────────
function validate(form: FormState, mode: 'admin' | 'vendor', vendorId: string): FieldError {
  const errors: FieldError = {};
  if (!form.name.trim())         errors.name         = 'Le nom est requis.';
  if (!form.description.trim())  errors.description  = 'La description est requise.';
  if (!form.type)                errors.type         = 'Le type est requis.';
  if (!form.location.trim())     errors.location     = 'La localisation est requise.';
  if (!form.pricePerNight || Number(form.pricePerNight) <= 0)
                                  errors.pricePerNight = 'Prix invalide.';
  if (mode === 'vendor' && !vendorId) errors.vendor  = 'Veuillez sélectionner un hôte.';
  return errors;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function AdminCreateMaisonPage() {
  const router    = useRouter();
  const { data: session } = useSession();
  const apiToken  = (session as any)?.apiToken as string | undefined;

  // ── Form ──────────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>({
    name: '', description: '', type: '',
    location: '', region: '', governorate: '', tag: '',
    pricePerNight: '', currency: 'TND', minNights: '1',
    phone: '', website: '',
  });
  const [amenities, setAmenities]   = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState('');
  const [images, setImages]         = useState<File[]>([]);
  const [previews, setPreviews]     = useState<string[]>([]);
  const [errors, setErrors]         = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Vendor search ─────────────────────────────────────────────────────────
  const [vendorEmail, setVendorEmail]         = useState('');
  const [vendorResults, setVendorResults]     = useState<Vendor[]>([]);
  const [vendorSearching, setVendorSearching] = useState(false);
  const [selectedVendor, setSelectedVendor]   = useState<Vendor | null>(null);
  const vendorDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mode, setMode] = useState<'admin' | 'vendor'>('admin');
  useEffect(() => {
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
  }, [vendorEmail, apiToken]);

  const pickVendor = (v: Vendor) => {
    setSelectedVendor(v);
    setVendorEmail(v.email);
    setVendorResults([]);
    setErrors(p => ({ ...p, vendor: undefined }));
  };
  const clearVendor = () => { setSelectedVendor(null); setVendorEmail(''); setVendorResults([]); };

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(p => ({ ...p, [name]: undefined }));
  };

  // ── Amenity helpers ───────────────────────────────────────────────────────
  const togglePreset = (a: string) => {
    setAmenities(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  };
  const addCustomAmenity = () => {
    const v = amenityInput.trim();
    if (v && !amenities.includes(v)) { setAmenities(prev => [...prev, v]); }
    setAmenityInput('');
  };
  const removeAmenity = (a: string) => setAmenities(prev => prev.filter(x => x !== a));

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
      amenities.forEach(a => body.append('amenities', a));
      images.forEach(img => body.append('images', img));

      let endpoint = '';
      if (mode === 'admin') {
        endpoint = `${API}/api/maisons-dhotes/admin/create`;
      } else {
        body.append('hostId', selectedVendor!._id);
        endpoint = `${API}/api/maisons-dhotes/admin/for-vendor`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiToken}` },
        body,
      });

      if (res.status === 401) throw new Error('Non autorisé — session expirée ?');
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        console.error('Server error payload:', payload);   // ← ADD THIS
        throw new Error(payload?.message ?? `Erreur ${res.status}`);
      }
      router.push('/dashboard/admin/maisonsdhotes');
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
          <Link href="/dashboard/admin/maisonsdhotes" className="mh-page-back">
            ← Retour aux maisons d'hôtes
          </Link>
          <h1 className="mh-page-title">Nouvelle Maison d'Hôte</h1>
          <p className="mh-page-subtitle">Créez un hébergement au nom d'un hôte</p>
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
                <h2 className="mh-card-title"><Building2 size={16} /> Informations générales</h2>
              </div>
              <div className="mh-card-body">

                {/* Name */}
                <div className="mh-form-group">
                  <label className="mh-form-label">Nom de la maison *</label>
                  <input
                    name="name" value={form.name} onChange={handle}
                    className={`mh-form-input${errors.name ? ' error' : ''}`}
                    placeholder="Ex: Dar El Aïn — Maison d'hôtes de charme"
                  />
                  {errors.name && <span className="mh-form-error">{errors.name}</span>}
                </div>

                {/* Type */}
                <div className="mh-form-group">
                  <label className="mh-form-label">Type *</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {(['traditionnelle', 'moderne'] as const).map(t => (
                      <button
                        key={t} type="button"
                        onClick={() => { setForm(f => ({ ...f, type: t })); setErrors(p => ({ ...p, type: undefined })); }}
                        style={{
                          flex: 1, padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                          border: `2px solid ${form.type === t ? (t === 'traditionnelle' ? '#B45309' : '#4338CA') : '#E2E8F0'}`,
                          background: form.type === t
                            ? (t === 'traditionnelle' ? '#FFF8ED' : '#EEF2FF')
                            : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          fontWeight: 650, fontSize: '0.875rem',
                          color: form.type === t
                            ? (t === 'traditionnelle' ? '#B45309' : '#4338CA')
                            : '#4A5568',
                          transition: 'all 0.18s',
                        }}
                      >
                        {t === 'traditionnelle' ? <Leaf size={15} /> : <Building2 size={15} />}
                        {t.charAt(0).toUpperCase() + t.slice(1)}
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
                    rows={5}
                    placeholder="Décrivez l'hébergement, son ambiance, son architecture…"
                  />
                  {errors.description && <span className="mh-form-error">{errors.description}</span>}
                </div>

              </div>
            </div>

            {/* Location */}
            <div className="mh-card mh-anim-fade-up mh-anim-d2">
              <div className="mh-card-header">
                <h2 className="mh-card-title"><MapPin size={16} /> Localisation</h2>
              </div>
              <div className="mh-card-body">
                <div className="mh-form-group">
                  <label className="mh-form-label">Adresse / Localisation *</label>
                  <input
                    name="location" value={form.location} onChange={handle}
                    className={`mh-form-input${errors.location ? ' error' : ''}`}
                    placeholder="Ex: Route de Tabarka, Ain Draham"
                  />
                  {errors.location && <span className="mh-form-error">{errors.location}</span>}
                </div>
                <div className="mh-grid-2col">
                  <div className="mh-form-group">
                    <label className="mh-form-label">Région</label>
                    <input
                      name="region" value={form.region} onChange={handle}
                      className="mh-form-input" placeholder="Ex: Kroumirie"
                    />
                  </div>
                  <div className="mh-form-group">
                    <label className="mh-form-label">Gouvernorat</label>
                    <input
                      name="governorate" value={form.governorate} onChange={handle}
                      className="mh-form-input" placeholder="Ex: Jendouba"
                    />
                  </div>
                </div>
                <div className="mh-form-group">
                  <label className="mh-form-label">
                    Étiquette carte{' '}
                    <span className="mh-form-hint">optionnel — ex: FORÊT, MÉDINA, BORD DE MER</span>
                  </label>
                  <input
                    name="tag" value={form.tag} onChange={handle}
                    className="mh-form-input" placeholder="FORÊT"
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="mh-card mh-anim-fade-up mh-anim-d3">
              <div className="mh-card-header">
                <h2 className="mh-card-title"><Phone size={16} /> Contact</h2>
              </div>
              <div className="mh-card-body">
                <div className="mh-grid-2col">
                  <div className="mh-form-group">
                    <label className="mh-form-label"><Phone size={13} /> Téléphone</label>
                    <input
                      name="phone" value={form.phone} onChange={handle}
                      className="mh-form-input" placeholder="+216 XX XXX XXX"
                    />
                  </div>
                  <div className="mh-form-group">
                    <label className="mh-form-label"><Globe size={13} /> Site web</label>
                    <input
                      name="website" value={form.website} onChange={handle}
                      className="mh-form-input" placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="mh-card mh-anim-fade-up mh-anim-d4">
              <div className="mh-card-header">
                <h2 className="mh-card-title">Équipements & Services</h2>
                <span className="mh-card-hint">{amenities.length} sélectionné(s)</span>
              </div>
              <div className="mh-card-body">
                <div className="mh-amenity-wrap">
                  {PRESET_AMENITIES.map(a => (
                    <button
                      key={a} type="button"
                      className={`mh-amenity-tag${amenities.includes(a) ? ' selected' : ''}`}
                      onClick={() => togglePreset(a)}
                    >
                      {amenities.includes(a) && <span>✓</span>} {a}
                    </button>
                  ))}
                </div>
                <div className="mh-amenity-add-wrap">
                  <input
                    className="mh-amenity-add-input"
                    value={amenityInput}
                    onChange={e => setAmenityInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomAmenity(); } }}
                    placeholder="Ajouter un équipement personnalisé…"
                  />
                  <button type="button" className="mh-amenity-add-btn" onClick={addCustomAmenity}>
                    + Ajouter
                  </button>
                </div>
                {amenities.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {amenities.map(a => (
                      <span key={a} className="mh-amenity-tag removable" onClick={() => removeAmenity(a)}>
                        {a} <X size={11} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Images */}
            <div className="mh-card mh-anim-fade-up mh-anim-d5">
              <div className="mh-card-header">
                <h2 className="mh-card-title">Photos</h2>
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
                      Glissez des photos ici ou <strong>cliquez pour choisir</strong>
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

            {/* Vendor search */}
            {/* Publication mode */}
            <div className="mh-card mh-anim-fade-up mh-anim-d1">
              <div className="mh-card-header">
                <h2 className="mh-card-title">Mode de publication</h2>
              </div>
              <div className="mh-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode('admin');
                    setSelectedVendor(null);
                    setVendorEmail('');
                    setErrors(p => ({ ...p, vendor: undefined }));
                  }}
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
                    👤 Publier pour un hôte
                  </div>
                  <div style={{ fontSize: '0.77rem', color: '#8B9AB5', marginTop: 3 }}>
                    Associe la maison à un compte hôte existant
                  </div>
                </button>
              </div>
            </div>

            {/* Pricing */}
            <div className="mh-card mh-anim-fade-up mh-anim-d2">
              <div className="mh-card-header">
                <h2 className="mh-card-title">Tarification</h2>
              </div>
              <div className="mh-card-body">
                <div className="mh-form-group">
                  <label className="mh-form-label">Prix / nuit *</label>
                  <div className="mh-input-prefix-wrap">
                    <span className="mh-input-prefix">TND</span>
                    <input
                      name="pricePerNight" type="number" min={0}
                      value={form.pricePerNight} onChange={handle}
                      className={`mh-form-input mh-input-with-prefix${errors.pricePerNight ? ' error' : ''}`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.pricePerNight && <span className="mh-form-error">{errors.pricePerNight}</span>}
                </div>
                <div className="mh-form-group">
                  <label className="mh-form-label"><Moon size={13} /> Séjour minimum (nuits)</label>
                  <input
                    name="minNights" type="number" min={1}
                    value={form.minNights} onChange={handle}
                    className="mh-form-input" placeholder="1"
                  />
                </div>
                <div className="mh-form-group" style={{ marginBottom: 0 }}>
                  <label className="mh-form-label">Devise</label>
                  <select name="currency" value={form.currency} onChange={handle} className="mh-form-select">
                    <option value="TND">TND — Dinar tunisien</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="USD">USD — Dollar</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="mh-tips-card mh-anim-fade-up mh-anim-d3">
              <div className="mh-tips-icon">🏡</div>
              <div className="mh-tips-title">Conseils pour un bon listing</div>
              <ul className="mh-tips-list">
                <li>Photos lumineuses et authentiques</li>
                <li>Décrivez l'histoire du lieu</li>
                <li>Mentionnez les activités à proximité</li>
                <li>Précisez les langues parlées</li>
              </ul>
            </div>

            {/* Submit */}
            <div className="mh-anim-fade-up mh-anim-d4">
              <button type="submit" className="mh-publish-btn" disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {submitting
                  ? <><Loader2 size={16} className="mh-spin" /> Publication…</>
                  : mode === 'admin'
                  ? '✦ Publier en tant qu\'admin'
                  : '✦ Publier pour l\'hôte'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}