'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const REGIONS = [
  'Tunis', 'Ariana', 'Ben Arous', 'Manouba',
  'Nabeul', 'Zaghouan', 'Bizerte', 'Béja',
  'Jendouba', 'Kef', 'Siliana', 'Sousse',
  'Monastir', 'Mahdia', 'Sfax', 'Kairouan',
  'Kasserine', 'Sidi Bouzid', 'Gabès', 'Medenine',
  'Tataouine', 'Gafsa', 'Tozeur', 'Kébili',
];

const SPECIALITES = [
  'Tissage & Tapis', 'Poterie & Céramique', 'Bijouterie & Argent',
  'Broderie & Couture', 'Maroquinerie', 'Sculpture sur bois',
  'Calligraphie', 'Autre',
];

interface FormState {
  phone: string;
  region: string;
  specialite: string;
  description: string;
  instagram: string;
  website: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;
  const user = (session as any)?.user;

  const [form, setForm] = useState<FormState>({
    phone: '',
    region: '',
    specialite: '',
    description: '',
    instagram: '',
    website: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const headers = {
    'Content-Type': 'application/json',
    ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
  };

  useEffect(() => {
    if (!apiToken) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/api/artisans/me`, { headers });
        if (res.status === 404) { setLoading(false); return; }
        if (!res.ok) throw new Error('Impossible de charger le profil');
        const data = await res.json();
        setIsApproved(data.isApproved ?? false);
        setProfilePhoto(data.profilePhoto ?? '');
        setForm({
          phone:       data.phone       ?? '',
          region:      data.region      ?? '',
          specialite:  data.specialite  ?? '',
          description: data.description ?? '',
          instagram:   data.instagram   ?? '',
          website:     data.website     ?? '',
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiToken]);

  const handle = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handlePhotoChange = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setPhotoDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePhotoChange(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const body = new FormData();
      body.append('phone',       form.phone);
      body.append('region',      form.region);
      body.append('specialite',  form.specialite);
      body.append('description', form.description);
      body.append('instagram',   form.instagram);
      body.append('website',     form.website);

      if (photoFile) {
        body.append('profilePhoto', photoFile);
      }

      const res = await fetch(`${API}/api/artisans/me`, {
        method: 'PUT',
        headers: apiToken ? { Authorization: `Bearer ${apiToken}` } : {},
        body,
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Erreur lors de la sauvegarde');
      }

      const saved = await res.json();
      if (saved.profilePhoto) {
        setProfilePhoto(saved.profilePhoto);
        setPhotoFile(null);
        setPhotoPreview(null);
      }

      setSuccessMsg('Profil mis à jour avec succès !');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.name ?? '—';
  const initials    = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const currentPhoto = photoPreview || profilePhoto;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .pp-wrap { font-family: 'DM Sans', sans-serif; }

        /* ── Page header ── */
        .pp-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 28px;
          animation: ppFadeUp 0.5s ease both;
        }
        .pp-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: #0A0F2C;
          margin: 0 0 4px;
        }
        .pp-subtitle { font-size: 0.875rem; color: #8B9AB5; margin: 0; }

        /* ── Grid layout ── */
        .pp-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .pp-grid { grid-template-columns: 1fr; }
        }

        /* ── Left card ── */
        .pp-left {
          background: #fff;
          border-radius: 16px;
          border: 1px solid rgba(2,52,171,0.08);
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(10,15,44,0.06);
          animation: ppFadeLeft 0.5s 0.1s ease both;
        }
        .pp-cover {
          height: 90px;
          background: linear-gradient(135deg, #0234AB 0%, #1a56db 60%, #3b82f6 100%);
          position: relative;
        }
        .pp-cover::after {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        /* ── Avatar / photo upload ── */
        .pp-avatar-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 20px 20px;
          margin-top: -44px;
          position: relative;
          z-index: 1;
        }
        .pp-photo-wrap {
          position: relative;
          width: 88px;
          height: 88px;
          border-radius: 50%;
          cursor: pointer;
        }
        .pp-photo-img {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #fff;
          box-shadow: 0 4px 16px rgba(2,52,171,0.18);
          display: block;
          background: #e8edf8;
        }
        .pp-initials {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          border: 3px solid #fff;
          box-shadow: 0 4px 16px rgba(2,52,171,0.18);
          background: linear-gradient(135deg, #0234AB, #1a56db);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .pp-photo-overlay {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(2,52,171,0.55);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          border: 3px solid #fff;
          gap: 2px;
        }
        .pp-photo-wrap:hover .pp-photo-overlay { opacity: 1; }
        .pp-photo-overlay-icon { font-size: 1.2rem; }
        .pp-photo-overlay-text {
          font-size: 0.6rem;
          font-weight: 600;
          color: #fff;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* drag zone shown when no photo */
        .pp-drop-zone {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          border: 2.5px dashed #0234AB;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f0f4ff;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          gap: 2px;
        }
        .pp-drop-zone.drag-over,
        .pp-drop-zone:hover { background: #dce7ff; border-color: #0a3ae0; }
        .pp-drop-zone-icon { font-size: 1.4rem; }
        .pp-drop-zone-text {
          font-size: 0.55rem;
          font-weight: 600;
          color: #0234AB;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          text-align: center;
        }

        .pp-photo-hint {
          font-size: 0.7rem;
          color: #8B9AB5;
          margin-top: 8px;
          text-align: center;
        }
        .pp-remove-photo {
          font-size: 0.7rem;
          color: #e53e3e;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          margin-top: 4px;
          text-decoration: underline;
          font-family: 'DM Sans', sans-serif;
        }
        .pp-remove-photo:hover { color: #c53030; }

        /* new-photo badge */
        .pp-new-badge {
          position: absolute;
          bottom: 2px;
          right: 2px;
          background: #0234AB;
          color: #fff;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(2,52,171,0.3);
        }

        /* ── Left card body info ── */
        .pp-name {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: #0A0F2C;
          margin: 10px 0 2px;
          text-align: center;
        }
        .pp-role { font-size: 0.78rem; color: #8B9AB5; margin-bottom: 10px; text-align: center; }

        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.03em;
        }
        .badge-success { background: #F0FFF4; color: #276749; border: 1px solid #9AE6B4; }
        .badge-warning { background: #FFFBEB; color: #92400E; border: 1px solid #FCD34D; }
        .badge-primary { background: #EBF4FF; color: #0234AB; border: 1px solid #BFDBFE; }

        .pp-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid rgba(2,52,171,0.07);
          margin-top: 12px;
        }
        .pp-stat {
          padding: 14px 8px;
          text-align: center;
          border-right: 1px solid rgba(2,52,171,0.07);
        }
        .pp-stat:last-child { border-right: none; }
        .pp-stat-val { font-size: 0.75rem; font-weight: 600; color: #0A0F2C; word-break: break-all; }
        .pp-stat-lbl { font-size: 0.62rem; color: #8B9AB5; margin-top: 2px; letter-spacing: 0.04em; text-transform: uppercase; }

        .pp-side-section {
          padding: 14px 20px;
          border-top: 1px solid rgba(2,52,171,0.07);
        }
        .pp-side-label {
          font-size: 0.68rem;
          font-weight: 600;
          color: #8B9AB5;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        /* ── Right card ── */
        .pp-right {
          background: #fff;
          border-radius: 16px;
          border: 1px solid rgba(2,52,171,0.08);
          box-shadow: 0 4px 24px rgba(10,15,44,0.06);
          overflow: hidden;
          animation: ppFadeRight 0.5s 0.15s ease both;
        }
        .pp-card-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid rgba(2,52,171,0.07);
        }
        .pp-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #0A0F2C;
          margin: 0;
        }
        .pp-card-body { padding: 24px; }

        /* ── Form elements ── */
        .pp-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 600px) { .pp-form-row { grid-template-columns: 1fr; } }

        .pp-form-group { margin-bottom: 16px; }
        .pp-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: #4A5568;
          margin-bottom: 6px;
          letter-spacing: 0.02em;
        }
        .pp-input, .pp-select, .pp-textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 14px;
          border: 1.5px solid rgba(2,52,171,0.15);
          border-radius: 10px;
          font-size: 0.875rem;
          font-family: 'DM Sans', sans-serif;
          color: #0A0F2C;
          background: #FAFBFF;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .pp-input:focus, .pp-select:focus, .pp-textarea:focus {
          border-color: #0234AB;
          box-shadow: 0 0 0 3px rgba(2,52,171,0.08);
          background: #fff;
        }
        .pp-input[readonly] {
          background: rgba(2,52,171,0.04);
          cursor: not-allowed;
          color: #8B9AB5;
        }
        .pp-textarea { resize: vertical; min-height: 130px; line-height: 1.6; }

        .pp-divider {
          height: 1px;
          background: rgba(2,52,171,0.07);
          margin: 20px 0;
        }
        .pp-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          font-weight: 600;
          color: #0A0F2C;
          margin-bottom: 16px;
        }

        /* ── Buttons ── */
        .pp-actions { display: flex; gap: 12px; margin-top: 8px; }
        .pp-btn {
          padding: 11px 24px;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .pp-btn:active { transform: scale(0.98); }
        .pp-btn-primary {
          background: linear-gradient(135deg, #0234AB, #1a56db);
          color: #fff;
          box-shadow: 0 4px 14px rgba(2,52,171,0.28);
        }
        .pp-btn-primary:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(2,52,171,0.38); }
        .pp-btn-secondary {
          background: rgba(2,52,171,0.07);
          color: #0234AB;
        }
        .pp-btn-secondary:hover:not(:disabled) { background: rgba(2,52,171,0.12); }
        .pp-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        /* ── Alerts ── */
        .pp-alert {
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 0.875rem;
        }
        .pp-alert-error { background: #FFF5F5; border: 1px solid #FEB2B2; color: #C53030; }
        .pp-alert-success { background: #F0FFF4; border: 1px solid #9AE6B4; color: #276749; }

        /* ── Loading ── */
        .pp-loading { text-align: center; padding: 60px; color: #8B9AB5; font-size: 0.875rem; }

        /* ── Animations ── */
        @keyframes ppFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ppFadeLeft {
          from { opacity: 0; transform: translateX(-14px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes ppFadeRight {
          from { opacity: 0; transform: translateX(14px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="pp-wrap">
        {/* Header */}
        <div className="pp-header">
          <div>
            <h1 className="pp-title">Mon Profil</h1>
            <p className="pp-subtitle">Gérez vos informations personnelles et votre storytelling</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="pp-alert pp-alert-error">{error}</div>
        )}
        {successMsg && (
          <div className="pp-alert pp-alert-success">✓ {successMsg}</div>
        )}

        {loading ? (
          <div className="pp-loading">Chargement du profil…</div>
        ) : (
          <div className="pp-grid">

            {/* ── LEFT card ── */}
            <div className="pp-left">
              <div className="pp-cover" />

              <div className="pp-avatar-area">
                {/* Hidden file input */}
                <input
                  ref={photoInputRef}
                  id="pp-photo-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoInputChange}
                />

                {currentPhoto ? (
                  /* Has photo: show image with hover overlay */
                  <div
                    className="pp-photo-wrap"
                    onClick={() => photoInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setPhotoDragOver(true); }}
                    onDragLeave={() => setPhotoDragOver(false)}
                    onDrop={handleDrop}
                    title="Cliquer pour changer la photo"
                  >
                    <img
                      src={currentPhoto}
                      alt="Photo de profil"
                      className="pp-photo-img"
                    />
                    <div className="pp-photo-overlay">
                      <span className="pp-photo-overlay-icon">📷</span>
                      <span className="pp-photo-overlay-text">Changer</span>
                    </div>
                    {photoPreview && (
                      <div className="pp-new-badge" title="Nouvelle photo (non sauvegardée)">✦</div>
                    )}
                  </div>
                ) : (
                  /* No photo: drag-and-drop zone */
                  <div
                    className={`pp-drop-zone${photoDragOver ? ' drag-over' : ''}`}
                    onClick={() => photoInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setPhotoDragOver(true); }}
                    onDragLeave={() => setPhotoDragOver(false)}
                    onDrop={handleDrop}
                    title="Cliquer ou déposer une photo"
                  >
                    <span className="pp-drop-zone-icon">📷</span>
                    <span className="pp-drop-zone-text">Ajouter<br />une photo</span>
                  </div>
                )}

                <p className="pp-photo-hint">
                  {photoPreview ? '⚠ Non sauvegardé — cliquez sur Sauvegarder' : 'JPG, PNG · max 5 MB'}
                </p>
                {photoPreview && (
                  <button className="pp-remove-photo" onClick={handleRemovePhoto}>
                    Annuler la nouvelle photo
                  </button>
                )}

                <div className="pp-name">{displayName}</div>
                <div className="pp-role">
                  {isApproved ? 'Artisan Certifié' : 'Candidature en attente'}
                </div>
                <span className={`badge ${isApproved ? 'badge-success' : 'badge-warning'}`}>
                  {isApproved ? '✓ Compte vérifié' : "⏳ En attente d'approbation"}
                </span>
              </div>

              {/* Stats row */}
              <div className="pp-stats">
                {[
                  { val: user?.email?.split('@')[0] ?? '—', lbl: 'ID' },
                  { val: form.region || '—',                lbl: 'Région' },
                  { val: form.phone  || '—',                lbl: 'Tél.' },
                ].map(s => (
                  <div key={s.lbl} className="pp-stat">
                    <div className="pp-stat-val">{s.val}</div>
                    <div className="pp-stat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>

              {form.specialite && (
                <div className="pp-side-section">
                  <div className="pp-side-label">Spécialité</div>
                  <span className="badge badge-primary">{form.specialite}</span>
                </div>
              )}

              {form.instagram && (
                <div className="pp-side-section">
                  <div className="pp-side-label">Réseaux sociaux</div>
                  <div style={{ fontSize: '0.85rem', color: '#0234AB', fontWeight: 500 }}>
                    📷 {form.instagram}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT card ── */}
            <div className="pp-right">
              <div className="pp-card-header">
                <h2 className="pp-card-title">Informations personnelles</h2>
              </div>
              <div className="pp-card-body">

                <div className="pp-form-row">
                  <div className="pp-form-group">
                    <label className="pp-label">Nom complet</label>
                    <input
                      className="pp-input"
                      value={displayName}
                      readOnly
                    />
                  </div>
                  <div className="pp-form-group">
                    <label className="pp-label">Email</label>
                    <input
                      className="pp-input"
                      value={user?.email ?? ''}
                      readOnly
                    />
                  </div>
                </div>

                <div className="pp-form-row">
                  <div className="pp-form-group">
                    <label className="pp-label">Téléphone</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handle}
                      className="pp-input"
                      placeholder="+216 00 000 000"
                    />
                  </div>
                  <div className="pp-form-group">
                    <label className="pp-label">Région</label>
                    <select name="region" value={form.region} onChange={handle} className="pp-select">
                      <option value="">— Choisir —</option>
                      {REGIONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div className="pp-form-group">
                  <label className="pp-label">Spécialité principale</label>
                  <select name="specialite" value={form.specialite} onChange={handle} className="pp-select">
                    <option value="">— Choisir —</option>
                    {SPECIALITES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div className="pp-divider" />

                <div className="pp-section-title">Mon histoire (Storytelling)</div>

                <div className="pp-form-group">
                  <label className="pp-label">
                    Biographie
                    <span style={{ fontWeight: 400, color: '#8B9AB5', marginLeft: 8 }}>
                      {form.description.length} / 600
                    </span>
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handle}
                    className="pp-textarea"
                    maxLength={600}
                    placeholder="Partagez votre passion pour l'artisanat, votre parcours, vos techniques…"
                  />
                </div>

                <div className="pp-form-row">
                  <div className="pp-form-group">
                    <label className="pp-label">Site web</label>
                    <input
                      name="website"
                      value={form.website}
                      onChange={handle}
                      className="pp-input"
                      placeholder="https://"
                    />
                  </div>
                  <div className="pp-form-group">
                    <label className="pp-label">Instagram</label>
                    <input
                      name="instagram"
                      value={form.instagram}
                      onChange={handle}
                      className="pp-input"
                      placeholder="@votre_compte"
                    />
                  </div>
                </div>

                <div className="pp-actions">
                  <button
                    className="pp-btn pp-btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Sauvegarde…' : '✦ Sauvegarder le profil'}
                  </button>
                  <button
                    className="pp-btn pp-btn-secondary"
                    onClick={() => window.location.reload()}
                    disabled={saving}
                  >
                    Annuler
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}