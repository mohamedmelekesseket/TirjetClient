'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApiToken } from '@/lib/useApiToken';
import {
  Loader2, ShieldCheck, ShieldOff, Sparkles, Star,
  MapPin, Phone, Globe, Moon, Leaf, Building2,
  X, ImagePlus, ToggleLeft, ToggleRight, AlertTriangle,
} from 'lucide-react';
import UploadImage from '@/app/dashboard/components/UploadImage';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Types ──────────────────────────────────────────────────────────────────
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

interface AdminToggles {
  isApproved: boolean;
  isSuspended: boolean;
  isEditorsPick: boolean;
  isFeatured: boolean;
}

const PRESET_AMENITIES = [
  'WiFi', 'Parking', 'Piscine', 'Climatisation', 'Chauffage',
  'Cuisine équipée', 'Petit-déjeuner inclus', 'Jardin', 'Terrasse',
  'Vue sur mer', 'Animaux acceptés', 'Accessible PMR',
];

// ── Component ──────────────────────────────────────────────────────────────
export default function AdminEditMaisonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();
  const { apiToken } = useApiToken();

  const [form, setForm] = useState<FormState>({
    name: '', description: '', type: '',
    location: '', region: '', governorate: '', tag: '',
    pricePerNight: '', currency: 'TND', minNights: '1',
    phone: '', website: '',
  });
  const [toggles, setToggles] = useState<AdminToggles>({
    isApproved: false, isSuspended: false, isEditorsPick: false, isFeatured: false,
  });
  const [amenities, setAmenities]   = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState('');

  // Images (uploaded URLs — persisted)
  const [images, _setImages] = useState<string[]>([]);
  const imagesRef = useRef<string[]>([]);
  const setImages = useCallback((updater: string[] | ((prev: string[]) => string[])) => {
    _setImages(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      imagesRef.current = next;
      return next;
    });
  }, []);

  const [uploading, setUploading] = useState(false);
  const [host, setHost] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [saveError, setSaveError]     = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const headers = useCallback(() => ({
    Authorization: `Bearer ${apiToken}`,
  }), [apiToken]);

  // ── Fetch maison ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!apiToken) return;
    const fetchMaison = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/maisons-dhotes/${id}`, { headers: headers() });
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const m = await res.json();

        setForm({
          name:          m.name           ?? '',
          description:   m.description    ?? '',
          type:          m.type           ?? '',
          location:      m.location       ?? '',
          region:        m.region         ?? '',
          governorate:   m.governorate    ?? '',
          tag:           m.tag            ?? '',
          pricePerNight: String(m.pricePerNight ?? ''),
          currency:      m.currency       ?? 'TND',
          minNights:     String(m.minNights ?? 1),
          phone:         m.phone          ?? '',
          website:       m.website        ?? '',
        });
        setToggles({
          isApproved:    !!m.isApproved,
          isSuspended:   !!m.isSuspended,
          isEditorsPick: !!m.isEditorsPick,
          isFeatured:    !!m.isFeatured,
        });
        setAmenities(m.amenities ?? []);
        setImages(m.images ?? []);
        if (m.host) setHost({ name: m.host.name, email: m.host.email });
      } catch (err: any) {
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMaison();
  }, [id, apiToken]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const toggle = (key: keyof AdminToggles) => {
    setToggles(t => {
      const next = { ...t, [key]: !t[key] };
      if (key === 'isSuspended' && next.isSuspended) next.isApproved  = false;
      if (key === 'isApproved'  && next.isApproved)  next.isSuspended = false;
      return next;
    });
  };

  const togglePreset = (a: string) =>
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  const addCustomAmenity = () => {
    const v = amenityInput.trim();
    if (v && !amenities.includes(v)) setAmenities(prev => [...prev, v]);
    setAmenityInput('');
  };
  const removeAmenity = (a: string) => setAmenities(prev => prev.filter(x => x !== a));

  const handleUpload = useCallback((urls: string[]) => {
    setUploading(false);
    setImages(prev => [...prev, ...urls]);
  }, [setImages]);
  const handleRemoveImage = useCallback((idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  }, [setImages]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (uploading) { setSaveError('Veuillez attendre la fin du téléchargement des images.'); return; }
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const cleanImages = imagesRef.current.filter(u => !u.startsWith('blob:'));

      const res = await fetch(`${API}/api/maisons-dhotes/${id}`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          pricePerNight: Number(form.pricePerNight),
          minNights:     Number(form.minNights),
          amenities,
          images: cleanImages,
          // Admin toggles
          isApproved:    toggles.isApproved,
          isSuspended:   toggles.isSuspended,
          isEditorsPick: toggles.isEditorsPick,
          isFeatured:    toggles.isFeatured,
        }),
      });

      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setSaveSuccess(true);
      setTimeout(() => router.push('/dashboard/admin/maisonsdhotes'), 1200);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading / Error states ────────────────────────────────────────────────
  if (loading) return (
    <div className="mh-loading-center" style={{ minHeight: '40vh' }}>
      <Loader2 size={30} className="mh-spin" style={{ opacity: 0.5 }} />
      <span>Chargement de la maison d'hôte…</span>
    </div>
  );

  if (fetchError) return (
    <div className="mh-error-state">
      <p>{fetchError}</p>
      <Link href="/dashboard/admin/maisonsdhotes" className="mh-btn mh-btn-secondary mh-btn-sm">
        ← Retour
      </Link>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="mh-page-header mh-anim-fade-up">
        <div>
          <Link href="/dashboard/admin/maisonsdhotes" className="mh-page-back">
            ← Retour aux maisons d'hôtes
          </Link>
          <h1 className="mh-page-title">
            Modifier la Maison d'Hôte{' '}
            <span style={{ fontSize: '0.72em', color: '#8B9AB5', fontWeight: 400 }}>(Admin)</span>
          </h1>
          <p className="mh-page-subtitle">
            {host
              ? <>Hébergement de <strong>{host.name}</strong> — {host.email}</>
              : 'Modifier toutes les informations'}
          </p>
        </div>
      </div>

      {saveError && (
        <div className="mh-alert mh-alert-error">
          <AlertTriangle size={15} /> {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="mh-alert mh-alert-success">
          ✓ Modifications enregistrées — redirection…
        </div>
      )}

      <div className="mh-create-grid">

        {/* ── LEFT ─────────────────────────────────────────────────────── */}
        <div className="mh-create-main">

          {/* General info */}
          <div className="mh-card mh-anim-fade-up mh-anim-d1">
            <div className="mh-card-header">
              <h2 className="mh-card-title"><Building2 size={16} /> Informations générales</h2>
            </div>
            <div className="mh-card-body">

              <div className="mh-form-group">
                <label className="mh-form-label">Nom de la maison</label>
                <input name="name" value={form.name} onChange={handle} className="mh-form-input" />
              </div>

              {/* Type selector */}
              <div className="mh-form-group">
                <label className="mh-form-label">Type</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['traditionnelle', 'moderne'] as const).map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, type: t }))}
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
              </div>

              <div className="mh-form-group">
                <label className="mh-form-label">Description</label>
                <textarea name="description" value={form.description} onChange={handle}
                  className="mh-form-textarea" rows={5} />
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
                <label className="mh-form-label">Adresse / Localisation</label>
                <input name="location" value={form.location} onChange={handle} className="mh-form-input" />
              </div>
              <div className="mh-grid-2col">
                <div className="mh-form-group">
                  <label className="mh-form-label">Région</label>
                  <input name="region" value={form.region} onChange={handle} className="mh-form-input" />
                </div>
                <div className="mh-form-group">
                  <label className="mh-form-label">Gouvernorat</label>
                  <input name="governorate" value={form.governorate} onChange={handle} className="mh-form-input" />
                </div>
              </div>
              <div className="mh-form-group">
                <label className="mh-form-label">Étiquette carte</label>
                <input name="tag" value={form.tag} onChange={handle} className="mh-form-input" placeholder="FORÊT" />
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
                  <input name="phone" value={form.phone} onChange={handle} className="mh-form-input" />
                </div>
                <div className="mh-form-group">
                  <label className="mh-form-label"><Globe size={13} /> Site web</label>
                  <input name="website" value={form.website} onChange={handle} className="mh-form-input" />
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
              <h2 className="mh-card-title">
                Photos
                {uploading && (
                  <span style={{ fontSize: '0.73rem', color: '#8B9AB5', fontWeight: 400, marginLeft: 8 }}>
                    <Loader2 size={12} className="mh-spin" style={{ display: 'inline', marginRight: 4 }} />
                    Upload en cours…
                  </span>
                )}
              </h2>
            </div>
            <div className="mh-card-body">
              {images.length > 0 && (
                <div className="mh-image-grid" style={{ marginBottom: 14 }}>
                  {images.map((src, i) => (
                    <div key={i} className="mh-image-thumb">
                      <img src={src} alt={`photo-${i}`} />
                      <button
                        className="mh-image-thumb-remove"
                        onClick={() => handleRemoveImage(i)}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <UploadImage
                multiple
                onUploadStart={() => setUploading(true)}
                onUpload={handleUpload}
              />
            </div>
          </div>

          {/* Admin toggles */}
          <div className="mh-card mh-card-admin mh-anim-fade-up mh-anim-d5">
            <div className="mh-card-header">
              <h2 className="mh-card-title">
                <ShieldCheck size={16} style={{ color: '#805ad5' }} /> Contrôles Admin
              </h2>
            </div>
            <div className="mh-card-body">
              <div className="mh-toggles-grid">
                <AdminToggle
                  icon={<ShieldCheck size={15} />}
                  label="Approuvée"
                  description="Visible sur la plateforme"
                  active={toggles.isApproved}
                  activeClass="active-green"
                  activeColor="#0B9E5E"
                  onClick={() => toggle('isApproved')}
                />
                <AdminToggle
                  icon={<ShieldOff size={15} />}
                  label="Suspendue"
                  description="Masquée & non approuvée"
                  active={toggles.isSuspended}
                  activeClass="active-red"
                  activeColor="#E53E3E"
                  onClick={() => toggle('isSuspended')}
                />
                <AdminToggle
                  icon={<Sparkles size={15} />}
                  label="Mise en avant"
                  description="Affichée en page d'accueil"
                  active={toggles.isFeatured}
                  activeClass="active-blue"
                  activeColor="#0234AB"
                  onClick={() => toggle('isFeatured')}
                />
                <AdminToggle
                  icon={<Star size={15} />}
                  label="Choix de l'éditeur"
                  description="Sélection éditoriale"
                  active={toggles.isEditorsPick}
                  activeClass="active-purple"
                  activeColor="#6B46C1"
                  onClick={() => toggle('isEditorsPick')}
                />
              </div>

              {toggles.isSuspended && (
                <div className="mh-suspended-warn">
                  <AlertTriangle size={14} />
                  Cette maison d'hôte sera suspendue et retirée de la plateforme.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── RIGHT ────────────────────────────────────────────────────── */}
        <div className="mh-create-side">

          {/* Pricing */}
          <div className="mh-card mh-anim-fade-up mh-anim-d2">
            <div className="mh-card-header">
              <h2 className="mh-card-title">Tarification</h2>
            </div>
            <div className="mh-card-body">
              <div className="mh-form-group">
                <label className="mh-form-label">Prix / nuit (TND)</label>
                <div className="mh-input-prefix-wrap">
                  <span className="mh-input-prefix">TND</span>
                  <input name="pricePerNight" type="number" min={0}
                    value={form.pricePerNight} onChange={handle}
                    className="mh-form-input mh-input-with-prefix" />
                </div>
              </div>
              <div className="mh-form-group">
                <label className="mh-form-label"><Moon size={13} /> Séjour minimum</label>
                <input name="minNights" type="number" min={1}
                  value={form.minNights} onChange={handle} className="mh-form-input" />
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

          {/* Status overview */}
          <div className="mh-card mh-anim-fade-up mh-anim-d3">
            <div className="mh-card-header">
              <h2 className="mh-card-title">Statut actuel</h2>
            </div>
            <div className="mh-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="mh-status-line">
                <span className="mh-status-label">Approbation</span>
                <span className="mh-status-value" style={{ color: toggles.isApproved ? '#0B9E5E' : '#D97706' }}>
                  {toggles.isApproved ? 'Approuvée' : 'En attente'}
                </span>
              </div>
              <div className="mh-status-line">
                <span className="mh-status-label">Suspension</span>
                <span className="mh-status-value" style={{ color: toggles.isSuspended ? '#E53E3E' : '#0B9E5E' }}>
                  {toggles.isSuspended ? 'Suspendue' : 'Active'}
                </span>
              </div>
              <div className="mh-status-line">
                <span className="mh-status-label">Mise en avant</span>
                <span className="mh-status-value" style={{ color: toggles.isFeatured ? '#0234AB' : '#8B9AB5' }}>
                  {toggles.isFeatured ? 'En vedette' : 'Standard'}
                </span>
              </div>
              <div className="mh-status-line">
                <span className="mh-status-label">Choix éditeur</span>
                <span className="mh-status-value" style={{ color: toggles.isEditorsPick ? '#6B46C1' : '#8B9AB5' }}>
                  {toggles.isEditorsPick ? '✦ Sélectionné' : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mh-anim-fade-up mh-anim-d4">
            <button
              className="mh-publish-btn"
              onClick={handleSave}
              disabled={saving || uploading}
              style={{ opacity: (saving || uploading) ? 0.7 : 1 }}
            >
              {uploading
                ? <><Loader2 size={16} className="mh-spin" /> Upload en cours…</>
                : saving
                ? <><Loader2 size={16} className="mh-spin" /> Sauvegarde…</>
                : '✦ Sauvegarder les modifications'}
            </button>
            <button className="mh-draft-btn" onClick={() => router.back()} disabled={saving || uploading}>
              Annuler les changements
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function AdminToggle({
  icon, label, description,
  active, activeClass, activeColor, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  activeClass: string;
  activeColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`mh-toggle-row${active ? ' ' + activeClass : ''}`}
    >
      <span style={{ color: active ? activeColor : '#A0AEC0', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mh-toggle-label" style={{ color: active ? activeColor : '#2D3748' }}>{label}</div>
        <div className="mh-toggle-desc">{description}</div>
      </div>
      {active
        ? <ToggleRight size={19} style={{ color: activeColor, flexShrink: 0 }} />
        : <ToggleLeft  size={19} style={{ color: '#CBD5E0',  flexShrink: 0 }} />
      }
    </button>
  );
}