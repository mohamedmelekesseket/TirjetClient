'use client';

import { useState, useEffect } from 'react';
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

      const res = await fetch(`${API}/api/artisans/me`, {
        method: 'PUT',
        headers: apiToken ? { Authorization: `Bearer ${apiToken}` } : {},
        body,
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Erreur lors de la sauvegarde');
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

  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Mon Profil</h1>
          <p className="page-subtitle">Gérez vos informations personnelles et votre storytelling</p>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#FFF5F5', border: '1px solid #FEB2B2', color: '#C53030',
          borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{
          background: '#F0FFF4', border: '1px solid #9AE6B4', color: '#276749',
          borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '0.875rem',
        }}>
          ✓ {successMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#8B9AB5' }}>
          Chargement du profil…
        </div>
      ) : (
        <div className="pda-grid">

          {/* ── LEFT: profile card ── */}
          <div className="pda-card anim-fade-left">
            <div className="pda-cover" />
            <div style={{ padding: '0 20px' }}>
              <div className="pda-avatar-wrap">
                <div className="pda-avatar">{initials}</div>
              </div>
              <div className="pda-info-center">
                <div className="pda-name">{displayName}</div>
                <div className="pda-role">
                  {isApproved ? 'Artisan Certifié' : 'Candidature en attente'}
                </div>
                <span className={`badge ${isApproved ? 'badge-success' : 'badge-warning'}`}>
                  {isApproved ? '✓ Compte vérifié' : '⏳ En attente d\'approbation'}
                </span>
              </div>
            </div>

            <div className="pda-stats-row">
              {[
                { num: user?.email?.split('@')[0] ?? '—', lbl: 'Identifiant' },
                { num: form.region || '—',                lbl: 'Région' },
                { num: form.phone  || '—',                lbl: 'Téléphone' },
              ].map(s => (
                <div key={s.lbl} className="pda-stat-item">
                  <div className="pda-stat-num" style={{ fontSize: '0.8rem' }}>{s.num}</div>
                  <div className="pda-stat-label">{s.lbl}</div>
                </div>
              ))}
            </div>

            {form.specialite && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(2,52,171,0.07)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#8B9AB5', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Spécialité
                </div>
                <span className="badge badge-primary">{form.specialite}</span>
              </div>
            )}

            {form.instagram && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(2,52,171,0.07)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#8B9AB5', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Réseaux sociaux
                </div>
                <div style={{ fontSize: '0.85rem', color: '#0234AB', fontWeight: 500 }}>
                  📷 {form.instagram}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: form ── */}
          <div className="pda-form-card anim-fade-right">
            <div className="card-header">
              <h2 className="card-title">Informations personnelles</h2>
            </div>
            <div className="card-body">

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Nom complet</label>
                  <input
                    className="form-input"
                    value={displayName}
                    readOnly
                    style={{ background: 'rgba(2,52,171,0.04)', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    value={user?.email ?? ''}
                    readOnly
                    style={{ background: 'rgba(2,52,171,0.04)', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input
                    name="phone" value={form.phone} onChange={handle}
                    className="form-input" placeholder="+216 00 000 000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Région</label>
                  <select name="region" value={form.region} onChange={handle} className="form-select">
                    <option value="">— Choisir —</option>
                    {REGIONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Spécialité principale</label>
                <select name="specialite" value={form.specialite} onChange={handle} className="form-select">
                  <option value="">— Choisir —</option>
                  {SPECIALITES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ height: '1px', background: 'rgba(2,52,171,0.07)', margin: '20px 0' }} />
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 600, color: '#0A0F2C', marginBottom: '16px' }}>
                Mon histoire (Storytelling)
              </div>

              <div className="form-group">
                <label className="form-label">
                  Biographie
                  <span style={{ fontWeight: 400, color: '#8B9AB5', marginLeft: 8 }}>
                    {form.description.length} / 600
                  </span>
                </label>
                <textarea
                  name="description" value={form.description} onChange={handle}
                  className="form-textarea" rows={6}
                  maxLength={600}
                  placeholder="Partagez votre passion pour l'artisanat, votre parcours, vos techniques…"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Site web</label>
                  <input name="website" value={form.website} onChange={handle}
                    className="form-input" placeholder="https://" />
                </div>
                <div className="form-group">
                  <label className="form-label">Instagram</label>
                  <input name="instagram" value={form.instagram} onChange={handle}
                    className="form-input" placeholder="@votre_compte" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Sauvegarde…' : '✦ Sauvegarder le profil'}
                </button>
                <button
                  className="btn btn-secondary"
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
  );
}