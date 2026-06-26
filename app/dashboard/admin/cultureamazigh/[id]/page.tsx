'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApiToken } from '@/lib/useApiToken';
import {
  Loader2, ShieldCheck, ShieldOff, Sparkles, Star,
  X, BookOpen, Feather, Music, Sprout, Home, Layers, FileText,
  ToggleLeft, ToggleRight, AlertTriangle,
} from 'lucide-react';
import UploadImage from '@/app/dashboard/components/UploadImage';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Types ──────────────────────────────────────────────────────────────────
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
  Auteur: string;
  title: string;
  description: string;
  type: CultureType | '';
}

interface AdminToggles {
  isApproved: boolean;
  isSuspended: boolean;
  isEditorsPick: boolean;
  isFeatured: boolean;
}

const PRESET_TAGS = [
  'Tifinagh', 'Oral', 'Manuscrit', 'Artisanat', 'Tatouage',
  'Textile', 'Céramique', 'Poésie', 'Chant', 'Danse',
  'Rite', 'Gastronomie', 'Architecture', 'Bijou',
];

// ── Component ──────────────────────────────────────────────────────────────
export default function AdminEditCulturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();
  const { apiToken } = useApiToken();

  const [form, setForm] = useState<FormState>({ Auteur: '', title: '', description: '', type: '' });
  const [toggles, setToggles] = useState<AdminToggles>({
    isApproved: false, isSuspended: false, isEditorsPick: false, isFeatured: false,
  });
  const [tags, setTags]         = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Images (persisted URLs)
  const [images, _setImages] = useState<string[]>([]);
  const imagesRef = useRef<string[]>([]);
  const setImages = useCallback((updater: string[] | ((prev: string[]) => string[])) => {
    _setImages(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      imagesRef.current = next;
      return next;
    });
  }, []);

  const [uploading, setUploading]     = useState(false);
  const [host, setHost]               = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [saveError, setSaveError]     = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const headers = useCallback(() => ({
    Authorization: `Bearer ${apiToken}`,
  }), [apiToken]);

  // ── Fetch culture ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!apiToken) return;
    const fetchCulture = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/culture-amazigh/${id}`, { headers: headers() });
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const c = await res.json();

        setForm({
          Auteur:      c.Auteur        ?? '',
          title:       c.title       ?? '',
          description: c.description ?? '',
          type:        c.type        ?? '',
        });
        setToggles({
          isApproved:    !!c.isApproved,
          isSuspended:   !!c.isSuspended,
          isEditorsPick: !!c.isEditorsPick,
          isFeatured:    !!c.isFeatured,
        });
        setTags(c.amenities ?? []);
        setImages(c.images  ?? []);
        if (c.host) setHost({ name: c.host.name, email: c.host.email });
      } catch (err: any) {
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCulture();
  }, [id, apiToken]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const toggleTag = (t: string) =>
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const addCustomTag = () => {
    const v = tagInput.trim();
    if (v && !tags.includes(v)) setTags(prev => [...prev, v]);
    setTagInput('');
  };
  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  const handleUpload = useCallback((urls: string[]) => {
    setUploading(false);
    setImages(prev => [...prev, ...urls]);
  }, [setImages]);
  const handleRemoveImage = useCallback((idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  }, [setImages]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (uploading) { setSaveError('Veuillez attendre la fin du téléchargement.'); return; }
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const cleanImages = imagesRef.current.filter(u => !u.startsWith('blob:'));

      const res = await fetch(`${API}/api/culture-amazigh/${id}`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amenities: tags,
          images: cleanImages,
          isApproved:    toggles.isApproved,
          isSuspended:   toggles.isSuspended,
          isEditorsPick: toggles.isEditorsPick,
          isFeatured:    toggles.isFeatured,
        }),
      });

      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setSaveSuccess(true);
      setTimeout(() => router.push('/dashboard/admin/culture-amazigh'), 1200);
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
      <span>Chargement de la publication…</span>
    </div>
  );

  if (fetchError) return (
    <div className="mh-error-state">
      <p>{fetchError}</p>
      <Link href="/dashboard/admin/culture-amazigh" className="mh-btn mh-btn-secondary mh-btn-sm">
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
          <Link href="/dashboard/admin/culture-amazigh" className="mh-page-back">
            ← Retour aux publications
          </Link>
          <h1 className="mh-page-title">
            Modifier la Publication{' '}
            <span style={{ fontSize: '0.72em', color: '#8B9AB5', fontWeight: 400 }}>(Admin)</span>
          </h1>
          <p className="mh-page-subtitle">
            {host
              ? <>Publication de <strong>{host.name}</strong> — {host.email}</>
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
              <h2 className="mh-card-title"><BookOpen size={16} /> Informations générales</h2>
            </div>
            <div className="mh-card-body">

              <div className="mh-form-group">
                <label className="mh-form-label">Titre *</label>
                <input name="title" value={form.title} onChange={handle} className="mh-form-input" />
              </div>

              <div className="mh-form-group">
                <label className="mh-form-label">
                  Nom court <span className="mh-form-hint">optionnel</span>
                </label>
                <input name="Auteur" value={form.Auteur} onChange={handle} className="mh-form-input" />
              </div>

              {/* Type selector */}
              <div className="mh-form-group">
                <label className="mh-form-label">Type de publication</label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 8,
                  }}
                >
                  {ALLOWED_TYPES.map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        border: `2px solid ${form.type === t ? '#7C3AED' : '#E2E8F0'}`,
                        background: form.type === t ? '#F5F3FF' : '#fff',
                        display: 'flex', alignItems: 'center', gap: 7,
                        fontWeight: form.type === t ? 650 : 400,
                        fontSize: '0.82rem',
                        color: form.type === t ? '#7C3AED' : '#4A5568',
                        transition: 'all 0.18s',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ color: form.type === t ? '#7C3AED' : '#8B9AB5', flexShrink: 0 }}>
                        {TYPE_ICONS[t]}
                      </span>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mh-form-group">
                <label className="mh-form-label">Description</label>
                <textarea
                  name="description" value={form.description} onChange={handle}
                  className="mh-form-textarea" rows={6}
                />
              </div>
            </div>
          </div>



          {/* Images */}
          <div className="mh-card mh-anim-fade-up mh-anim-d3">
            <div className="mh-card-header">
              <h2 className="mh-card-title">
                Photos & Médias
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
                      <button className="mh-image-thumb-remove" onClick={() => handleRemoveImage(i)}>
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
          <div className="mh-card mh-card-admin mh-anim-fade-up mh-anim-d4">
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
                  Cette publication sera suspendue et retirée de la plateforme.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── RIGHT ────────────────────────────────────────────────────── */}
        <div className="mh-create-side">

          {/* Current type display */}
          {form.type && (
            <div className="mh-card mh-anim-fade-up mh-anim-d1" style={{ border: '1.5px solid #7C3AED22' }}>
              <div className="mh-card-header">
                <h2 className="mh-card-title">Type de publication</h2>
              </div>
              <div className="mh-card-body" style={{ paddingTop: 10, paddingBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#7C3AED', flexShrink: 0,
                  }}>
                    {TYPE_ICONS[form.type as CultureType]}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#8B9AB5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Catégorie
                    </div>
                    <div style={{ fontWeight: 650, color: '#7C3AED', fontSize: '0.875rem' }}>
                      {form.type}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status overview */}
          <div className="mh-card mh-anim-fade-up mh-anim-d2">
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
          <div className="mh-anim-fade-up mh-anim-d3">
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

// ── Sub-component ──────────────────────────────────────────────────────────
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
        : <ToggleLeft  size={19} style={{ color: '#CBD5E0',  flexShrink: 0 }} />}
    </button>
  );
}