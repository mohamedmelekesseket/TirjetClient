'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApiToken } from '@/lib/useApiToken';
import {
  Loader2, Search, UserCheck, X, ImagePlus,
  BookOpen, Feather, Star, Music, Sprout, Home, Layers, FileText,
  Info, Video, Link as LinkIcon, Plus, Film,
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/lib/toast';

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
  Auteur: string;
  title: string;
  description: string;
  type: CultureType | '';
}

interface FieldError {
  title?: string;
  description?: string;
  type?: string;
  vendor?: string;
  videoUrl?: string;
}

// ── Video URL helpers ──────────────────────────────────────────────────────
type VideoSource = 'youtube' | 'vimeo' | 'unknown';

function detectVideoSource(url: string): VideoSource {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/vimeo\.com/.test(url)) return 'vimeo';
  return 'unknown';
}

function getVideoThumbnail(url: string): string | null {
  const ytMatch = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
  return null;
}

function getVideoEmbed(url: string): string | null {
  const ytMatch = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

function isValidVideoUrl(url: string): boolean {
  try { new URL(url); return true; } catch { return false; }
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
  const { apiToken, apiUser, session, error: tokenError, refresh } = useApiToken();

  const [mode, setMode] = useState<'admin' | 'vendor'>('admin');

  const [form, setForm] = useState<FormState>({ Auteur: '', title: '', description: '', type: '' });
  const [tags, setTags]           = useState<string[]>([]);
  const [tagInput, setTagInput]   = useState('');

  // ── Images ────────────────────────────────────────────────────────────────
  const [images, setImages]       = useState<File[]>([]);
  const [previews, setPreviews]   = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Videos (Cloudinary upload) ────────────────────────────────────────────
  const [videoFiles, setVideoFiles]     = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);   // local object URLs
  const videoFileRef = useRef<HTMLInputElement>(null);

  // ── Video URLs (YouTube / Vimeo) ──────────────────────────────────────────
  const [videoUrls, setVideoUrls]   = useState<string[]>([]);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoUrlError, setVideoUrlError] = useState('');

  // ── Media tab ─────────────────────────────────────────────────────────────
  const [mediaTab, setMediaTab] = useState<'images' | 'videos'>('images');

  const [errors, setErrors]       = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Show token error if present
  useEffect(() => {
    if (tokenError) {
      showErrorToast(tokenError);
    }
  }, [tokenError]);

  // Check admin role
  const isAdmin = apiUser?.role === 'admin';
  useEffect(() => {
    if (apiUser && !isAdmin) {
      showErrorToast('Accès refusé. Cette page est réservée aux administrateurs.');
    }
  }, [apiUser, isAdmin]);

  // ── Vendor search ─────────────────────────────────────────────────────────
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
  }, [vendorEmail, apiToken, mode, refresh]);

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
  const handleImageFiles = (files: FileList | null) => {
    if (!files) return;
    const maxSize = 5 * 1024 * 1024; // 5MB per image
    const newFiles = Array.from(files)
      .filter(f => f.size <= maxSize)
      .slice(0, 8 - images.length);
    
    if (newFiles.length < files.length) {
      showErrorToast('Certains fichiers ont été ignorés (taille > 5MB ou limite de 8 images).');
    }
    
    setImages(prev   => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
  };
  const removeImage = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setImages(prev   => prev.filter((_, j) => j !== i));
    setPreviews(prev => prev.filter((_, j) => j !== i));
  };
  const handleImageDrop = (e: React.DragEvent) => { e.preventDefault(); handleImageFiles(e.dataTransfer.files); };

  // ── Video file helpers ────────────────────────────────────────────────────
  const handleVideoFiles = (files: FileList | null) => {
    if (!files) return;
    const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    const maxSize = 100 * 1024 * 1024; // 100MB per video (Cloudinary plan limit)
    const newFiles = Array.from(files)
      .filter(f => allowed.includes(f.type) && f.size <= maxSize);
    
    if (newFiles.length < files.length) {
      showErrorToast('Certains fichiers vidéo ont été ignorés (format non supporté ou taille > 100MB).');
    }
    
    setVideoFiles(prev    => [...prev, ...newFiles]);
    setVideoPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
  };
  const removeVideoFile = (i: number) => {
    URL.revokeObjectURL(videoPreviews[i]);
    setVideoFiles(prev    => prev.filter((_, j) => j !== i));
    setVideoPreviews(prev => prev.filter((_, j) => j !== i));
  };
  const handleVideoDrop = (e: React.DragEvent) => { e.preventDefault(); handleVideoFiles(e.dataTransfer.files); };

  // ── Video URL helpers ─────────────────────────────────────────────────────
  const addVideoUrl = () => {
    const url = videoUrlInput.trim();
    if (!url) return;
    if (!isValidVideoUrl(url)) { setVideoUrlError('URL invalide.'); return; }
    if (videoUrls.includes(url)) { setVideoUrlError('Cette URL est déjà ajoutée.'); return; }
    setVideoUrls(prev => [...prev, url]);
    setVideoUrlInput('');
    setVideoUrlError('');
  };
  const removeVideoUrl = (i: number) => setVideoUrls(prev => prev.filter((_, j) => j !== i));

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = async () => {
    const errs = validate(form, mode, selectedVendor?._id ?? '');
    if (Object.keys(errs).length) { setErrors(errs); return; }

    if (!apiToken) {
      showErrorToast('Session non authentifiée. Veuillez vous reconnecter avec Google.');
      return;
    }

    try {
      setSubmitting(true);
      setUploadProgress('Préparation de l\'envoi...');

      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) body.append(k, v); });
      tags.forEach(t => body.append('amenities', t));
      images.forEach(img => body.append('images', img));
      videoFiles.forEach(v => body.append('videos', v));
      videoUrls.forEach(u => body.append('videoUrls', u));

      let endpoint = '';
      if (mode === 'admin') {
        endpoint = `${API}/api/culture-amazigh/admin/create`;
      } else {
        body.append('hostId', selectedVendor!._id);
        endpoint = `${API}/api/culture-amazigh/admin/for-vendor`;
      }

      console.log('Submitting to endpoint:', endpoint);
      console.log('apiToken exists:', !!apiToken);
      console.log('apiToken length:', apiToken?.length);
      console.log('Session:', session);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 5 minute timeout

      setUploadProgress(`Envoi de ${images.length} image(s) et ${videoFiles.length} vidéo(s)...`);

      let res;
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiToken}` },
          body,
          signal: controller.signal,
        });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new Error('Délai d\'attente dépassé (5min). Vérifiez votre connexion ou réduisez la taille des fichiers.');
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }

      setUploadProgress('Traitement de la réponse...');

      if (res.status === 401) throw new Error('Non autorisé — session expirée ?');
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message ?? `Erreur ${res.status}`);
      }
      router.push('/dashboard/admin/cultureamazigh');
      showSuccessToast('Contenu culturel créé avec succès !');
    } catch (err: any) {
      showErrorToast(err.message);
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const totalMedia = images.length + videoFiles.length + videoUrls.length;

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

            {/* ── Media Card ───────────────────────────────────────────────── */}
            <div className="mh-card mh-anim-fade-up mh-anim-d3">
              <div className="mh-card-header">
                <h2 className="mh-card-title">Photos &amp; Vidéos</h2>
                <span className="mh-card-hint">{totalMedia} fichier{totalMedia !== 1 ? 's' : ''}</span>
              </div>

              {/* Tab bar */}
              <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', paddingInline: 20 }}>
                {(['images', 'videos'] as const).map(tab => (
                  <button
                    key={tab} type="button"
                    onClick={() => setMediaTab(tab)}
                    style={{
                      padding: '10px 16px', fontSize: '0.83rem', fontWeight: mediaTab === tab ? 650 : 400,
                      color: mediaTab === tab ? '#7C3AED' : '#8B9AB5',
                      border: `2px solid ${mediaTab === tab ? '#7C3AED' : 'transparent'}`,
                      background: 'none', borderRadius: 0,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      marginBottom: -1, transition: 'all 0.15s',
                    }}
                  >
                    {tab === 'images'
                      ? <><ImagePlus size={14} /> Photos <span style={{ background: mediaTab === tab ? '#EDE9FE' : '#F1F5F9', color: mediaTab === tab ? '#7C3AED' : '#8B9AB5', borderRadius: 20, padding: '1px 7px', fontSize: '0.75rem', fontWeight: 600 }}>{images.length}</span></>
                      : <><Film size={14} /> Vidéos <span style={{ background: mediaTab === tab ? '#EDE9FE' : '#F1F5F9', color: mediaTab === tab ? '#7C3AED' : '#8B9AB5', borderRadius: 20, padding: '1px 7px', fontSize: '0.75rem', fontWeight: 600 }}>{videoFiles.length + videoUrls.length}</span></>
                    }
                  </button>
                ))}
              </div>

              <div className="mh-card-body">

                {/* ── Images tab ─────────────────────────────────────────── */}
                {mediaTab === 'images' && (
                  <>
                    {images.length < 8 && (
                      <div
                        className="mh-drop-zone"
                        onDragOver={e => e.preventDefault()} onDrop={handleImageDrop}
                        onClick={() => fileRef.current?.click()}
                        role="button" tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
                      >
                        <ImagePlus size={28} style={{ margin: '0 auto .6rem', opacity: 0.4 }} />
                        <p className="mh-drop-zone-text">
                          Glissez des images ici ou <strong>cliquez pour choisir</strong>
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#B0BAC9', marginTop: 4 }}>
                          JPG, PNG, WEBP — max 8 images
                        </p>
                        <input ref={fileRef} type="file" accept="image/*" multiple
                          style={{ display: 'none' }} onChange={e => handleImageFiles(e.target.files)} />
                      </div>
                    )}
                    {previews.length > 0 && (
                      <div className="mh-image-grid" style={{ marginTop: previews.length && images.length < 8 ? 12 : 0 }}>
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
                    {previews.length === 0 && images.length >= 8 && (
                      <p style={{ fontSize: '0.8rem', color: '#8B9AB5', textAlign: 'center', padding: '8px 0' }}>
                        Limite de 8 images atteinte.
                      </p>
                    )}
                  </>
                )}

                {/* ── Videos tab ─────────────────────────────────────────── */}
                {mediaTab === 'videos' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* — Upload section — */}
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4A5568', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Video size={13} /> Téléverser une vidéo
                      </div>
                      <div
                        className="mh-drop-zone"
                        onDragOver={e => e.preventDefault()} onDrop={handleVideoDrop}
                        onClick={() => videoFileRef.current?.click()}
                        role="button" tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && videoFileRef.current?.click()}
                        style={{ padding: '20px 16px' }}
                      >
                        <Film size={26} style={{ margin: '0 auto .5rem', opacity: 0.35 }} />
                        <p className="mh-drop-zone-text">
                          Glissez une vidéo ici ou <strong>cliquez pour choisir</strong>
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#B0BAC9', marginTop: 4 }}>
                          MP4, WebM, MOV, AVI — max 100MB
                        </p>
                        <input ref={videoFileRef} type="file" accept="video/*" multiple
                          style={{ display: 'none' }} onChange={e => handleVideoFiles(e.target.files)} />
                      </div>

                      {/* Uploaded video previews */}
                      {videoPreviews.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                          {videoPreviews.map((src, i) => (
                            <div
                              key={src}
                              style={{
                                border: '1.5px solid #E2E8F0', borderRadius: 10, overflow: 'hidden',
                                position: 'relative', background: '#000',
                              }}
                            >
                              <video
                                src={src} controls preload="metadata"
                                style={{ width: '100%', maxHeight: 240, display: 'block', objectFit: 'contain' }}
                              />
                              <button
                                type="button" onClick={() => removeVideoFile(i)}
                                style={{
                                  position: 'absolute', top: 8, right: 8,
                                  background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                                  width: 26, height: 26, display: 'flex', alignItems: 'center',
                                  justifyContent: 'center', cursor: 'pointer', color: '#fff',
                                }}
                              >
                                <X size={13} />
                              </button>
                              <div style={{ padding: '6px 10px', background: '#0a0a0a' }}>
                                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                                  {videoFiles[i]?.name ?? '—'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* — URL section — */}
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4A5568', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <LinkIcon size={13} /> Ajouter un lien YouTube / Vimeo
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="url" value={videoUrlInput}
                          onChange={e => { setVideoUrlInput(e.target.value); setVideoUrlError(''); }}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVideoUrl())}
                          className="mh-form-input"
                          placeholder="https://www.youtube.com/watch?v=..."
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button" onClick={addVideoUrl}
                          style={{
                            padding: '0 14px', borderRadius: 10, border: '2px solid #7C3AED',
                            background: '#7C3AED', color: '#fff', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem',
                            fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                          }}
                        >
                          <Plus size={14} /> Ajouter
                        </button>
                      </div>
                      {videoUrlError && (
                        <span className="mh-form-error" style={{ marginTop: 4, display: 'block' }}>
                          {videoUrlError}
                        </span>
                      )}

                      {/* URL list */}
                      {videoUrls.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                          {videoUrls.map((url, i) => {
                            const thumb    = getVideoThumbnail(url);
                            const source   = detectVideoSource(url);
                            const embedUrl = getVideoEmbed(url);
                            return (
                              <div
                                key={url}
                                style={{
                                  border: '1.5px solid #E2E8F0', borderRadius: 10,
                                  overflow: 'hidden', position: 'relative',
                                }}
                              >
                                {embedUrl ? (
                                  <iframe
                                    src={embedUrl} title={`video-${i}`}
                                    style={{ width: '100%', height: 200, display: 'block', border: 'none' }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                ) : thumb ? (
                                  <img src={thumb} alt="thumbnail"
                                    style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                                ) : (
                                  <div style={{
                                    height: 80, background: '#F1F5F9',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 8, color: '#8B9AB5', fontSize: '0.8rem',
                                  }}>
                                    <LinkIcon size={14} /> Lien vidéo externe
                                  </div>
                                )}
                                <div style={{
                                  padding: '7px 10px', background: '#F8FAFC',
                                  display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                  <span style={{
                                    fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
                                    letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 6,
                                    background: source === 'youtube' ? '#FEE2E2' : source === 'vimeo' ? '#DBEAFE' : '#F1F5F9',
                                    color: source === 'youtube' ? '#B91C1C' : source === 'vimeo' ? '#1D4ED8' : '#64748B',
                                    flexShrink: 0,
                                  }}>
                                    {source === 'youtube' ? 'YouTube' : source === 'vimeo' ? 'Vimeo' : 'URL'}
                                  </span>
                                  <span style={{
                                    fontSize: '0.74rem', color: '#64748B',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                                  }}>
                                    {url}
                                  </span>
                                  <button
                                    type="button" onClick={() => removeVideoUrl(i)}
                                    style={{
                                      background: 'none', border: 'none', cursor: 'pointer',
                                      color: '#8B9AB5', display: 'flex', alignItems: 'center', padding: 2, flexShrink: 0,
                                    }}
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

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
                    👤 Publier pour un autre account
                  </div>
                  <div style={{ fontSize: '0.77rem', color: '#8B9AB5', marginTop: 3 }}>
                    Associe la publication à un compte  existant
                  </div>
                </button>
              </div>
            </div>

            {/* Vendor search */}
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
              <div className="mh-tips-icon"><Info /></div>
              <div className="mh-tips-title">Conseils pour une bonne publication</div>
              <ul className="mh-tips-list">
                <li>Titre précis et évocateur</li>
                <li>Contexte historique documenté</li>
                <li>Images de qualité, haute résolution</li>
                <li>Vidéos sous-titrées si possible</li>
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
              {uploadProgress && (
                <div style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  color: '#0369A1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <Loader2 size={14} className="mh-spin" />
                  {uploadProgress}
                </div>
              )}
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}