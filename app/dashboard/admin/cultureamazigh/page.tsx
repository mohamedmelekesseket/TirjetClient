'use client';

import { useEffect, useState } from 'react';
import { useApiToken } from '@/lib/useApiToken';
import Link from 'next/link';
import {
  Plus, Eye, Check, X, Star, Search, Loader2,
  ShieldCheck, Sparkles, BookOpen, Music, Sprout,
  Home, Image, FileText, Feather, Layers,
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/lib/toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Types ──────────────────────────────────────────────────────────────────
interface Culture {
  _id: string;
  name?: string;
  title: string;
  description: string;
  type: string;
  images: string[];
  videos?: string[];
  isApproved: boolean;
  isSuspended: boolean;
  isEditorsPick: boolean;
  isFeatured: boolean;
  host: { _id: string; name: string; email: string } | null;
  rating: number;
  reviewCount: number;
  views: number;
  createdAt: string;
}

type FilterTab =
  | 'Tous'
  | 'Approuvés'
  | 'En attente'
  | 'Suspendus'
  | 'Mis en avant'
  | "Choix de l'éditeur";

// ── Type metadata ──────────────────────────────────────────────────────────
const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  'Langue amazigh':             { label: 'Langue',       icon: <Feather size={11} />,   color: '#7C3AED', bg: '#F5F3FF' },
  'Événements & traditions':    { label: 'Événements',   icon: <Star size={11} />,      color: '#D97706', bg: '#FFFBEB' },
  'Symboles et motifs berbères':{ label: 'Symboles',     icon: <Layers size={11} />,    color: '#DB2777', bg: '#FDF2F8' },
  'Musique amazigh':            { label: 'Musique',      icon: <Music size={11} />,     color: '#059669', bg: '#ECFDF5' },
  'Patrimoine et Traditions':   { label: 'Patrimoine',   icon: <Home size={11} />,      color: '#0369A1', bg: '#F0F9FF' },
  'Agriculture amazigh':        { label: 'Agriculture',  icon: <Sprout size={11} />,    color: '#65A30D', bg: '#F7FEE7' },
  'Architecture amazigh':       { label: 'Architecture', icon: <BookOpen size={11} />,  color: '#EA580C', bg: '#FFF7ED' },
  'Documentation':              { label: 'Documentation',icon: <FileText size={11} />,  color: '#475569', bg: '#F8FAFC' },
};

// ── Helpers ────────────────────────────────────────────────────────────────
const cultureStatus = (c: Culture): 'Approuvé' | 'En attente' | 'Suspendu' =>
  c.isSuspended ? 'Suspendu' : c.isApproved ? 'Approuvé' : 'En attente';

const statusBadge: Record<string, string> = {
  Approuvé:    'mh-badge mh-badge-success',
  'En attente':'mh-badge mh-badge-warning',
  Suspendu:    'mh-badge mh-badge-danger',
};

const getHostName = (host: Culture['host']): string => {
  if (!host) return '—';
  if (typeof host === 'string') return host;
  return host.name || '—';
};

// ── Component ──────────────────────────────────────────────────────────────
export default function AdminCultureAmazighPage() {
  const { apiToken, isLoading: tokenLoading } = useApiToken();

  const [cultures, setCultures]           = useState<Culture[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [search, setSearch]               = useState('');
  const [activeTab, setActiveTab]         = useState<FilterTab>('Tous');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Culture | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiToken}`,
  });

  const fetchCultures = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching cultures from:', `${API}/api/culture-amazigh?limit=100`);
      const res = await fetch(`${API}/api/culture-amazigh?limit=100`, { headers: headers() });
      console.log('Response status:', res.status);
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data = await res.json();
      console.log('Response data:', data);
      setCultures(data.cultures || []);
    } catch (err: any) {
      console.error('Fetch cultures error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (apiToken) fetchCultures(); }, [apiToken]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleApprove = async (id: string) => {
    setActionLoading(id + '-approve');
    try {
      const res = await fetch(`${API}/api/culture-amazigh/${id}/approve`, {
        method: 'PATCH', headers: headers(),
      });
      if (!res.ok) throw new Error('Échec');
      await fetchCultures();
      showSuccessToast('Publication approuvée');
    } catch (err: any) {
      showErrorToast('Erreur', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    setActionLoading(id + '-featured');
    try {
      const res = await fetch(`${API}/api/culture-amazigh/${id}/feature`, {
        method: 'PATCH', headers: headers(),
        body: JSON.stringify({ isFeatured: !current }),
      });
      if (!res.ok) throw new Error('Échec');
      setCultures(prev => prev.map(c => c._id === id ? { ...c, isFeatured: !current } : c));
      showSuccessToast(current ? 'Retiré des mis en avant' : 'Mis en avant');
    } catch (err: any) {
      showErrorToast('Erreur', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API}/api/culture-amazigh/${id}`, {
        method: 'DELETE', headers: headers(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setCultures(prev => prev.filter(c => c._id !== id));
      setDeleteConfirm(null);
      showSuccessToast('Publication supprimée');
    } catch (err: any) {
      showErrorToast('Suppression impossible', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = cultures.filter(c => {
    const status = cultureStatus(c);
    const matchTab =
      activeTab === 'Tous' ||
      (activeTab === 'Approuvés'           && status === 'Approuvé') ||
      (activeTab === 'En attente'          && status === 'En attente') ||
      (activeTab === 'Suspendus'           && status === 'Suspendu') ||
      (activeTab === 'Mis en avant'        && c.isFeatured) ||
      (activeTab === "Choix de l'éditeur" && c.isEditorsPick);
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase()) ||
      getHostName(c.host).toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    total:       cultures.length,
    approved:    cultures.filter(c => !c.isSuspended && c.isApproved).length,
    pending:     cultures.filter(c => !c.isApproved && !c.isSuspended).length,
    suspended:   cultures.filter(c => c.isSuspended).length,
    featured:    cultures.filter(c => c.isFeatured).length,
    editorsPick: cultures.filter(c => c.isEditorsPick).length,
  };

  const isSessionLoading = tokenLoading || (!apiToken);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="mh-modal-overlay" onClick={() => !deletingId && setDeleteConfirm(null)}>
          <div className="mh-modal" onClick={e => e.stopPropagation()}>
            <div className="mh-modal-icon">🪬</div>
            <h3 className="mh-modal-title">Supprimer la publication ?</h3>
            <p className="mh-modal-body">
              Cette action est irréversible.{' '}
              <strong>«&nbsp;{deleteConfirm.title}&nbsp;»</strong> sera définitivement supprimée.
            </p>
            <div className="mh-modal-actions">
              <button
                className="mh-btn mh-btn-secondary"
                disabled={!!deletingId}
                onClick={() => setDeleteConfirm(null)}
              >
                Annuler
              </button>
              <button
                className="mh-btn mh-btn-danger"
                disabled={deletingId === deleteConfirm._id}
                onClick={() => handleDelete(deleteConfirm._id)}
              >
                {deletingId === deleteConfirm._id
                  ? <><Loader2 size={14} className="mh-spin" /> Suppression…</>
                  : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="mh-page-header mh-anim-fade-up">
        <div>
          <h1 className="mh-page-title">Culture Amazigh</h1>
          <p className="mh-page-subtitle">Gérez et modérez les publications culturelles de la plateforme</p>
        </div>
        <div className="mh-header-right">
          <div className="mh-search-wrap">
            <span className="mh-search-icon"><Search size={15} /></span>
            <input
              className="mh-search-input"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Link href="/dashboard/admin/cultureamazigh/create" className="mh-btn mh-btn-primary">
            <Plus size={15} /> Nouvelle publication
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mh-stats-grid">
        {[
          { label: 'Total',        val: counts.total,     color: '#0234AB' },
          { label: 'Approuvées',   val: counts.approved,  color: '#0B9E5E' },
          { label: 'En attente',   val: counts.pending,   color: '#D97706' },
          { label: 'Suspendues',   val: counts.suspended, color: '#E53E3E' },
          { label: 'Mis en avant', val: counts.featured,  color: '#6B46C1' },
        ].map((s, i) => (
          <div key={s.label} className={`mh-stat-card mh-anim-fade-up mh-anim-d${i + 1}`}>
            <div className="mh-stat-label">{s.label}</div>
            <div className="mh-stat-value" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mh-tabs">
        {(['Tous', 'Approuvés', 'En attente', 'Suspendus', 'Mis en avant', "Choix de l'éditeur"] as FilterTab[]).map(t => (
          <button
            key={t}
            className={`mh-tab${activeTab === t ? ' active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t === 'Mis en avant'        && <Sparkles size={12} />}
            {t === "Choix de l'éditeur" && <Star size={12} />}
            {t}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="mh-card mh-anim-fade-up mh-anim-d3" style={{backgroundColor:"#18203A"}}>
        <div className="mh-card-header" style={{backgroundColor:"#18203A"}}>
          <h2 className="mh-card-title" style={{color:"white"}}>
            <BookOpen size={16} /> Catalogue complet
          </h2>
          <span className="mh-card-hint">{filtered.length} résultat(s)</span>
        </div>

        {(isSessionLoading || loading) && (
          <div className="mh-loading-center">
            <Loader2 size={22} className="mh-spin" /> Chargement…
          </div>
        )}
        {!isSessionLoading && !loading && error && (
          <div className="mh-error-state">
            {error}{' '}
            <button className="mh-btn mh-btn-secondary mh-btn-sm" onClick={fetchCultures}>
              Réessayer
            </button>
          </div>
        )}

        {!isSessionLoading && !loading && !error && (
          <div className="mh-table-wrap">
            <table className="mh-table">
              <thead>
                <tr>
                  <th>Publication</th>
                  <th>Auteur</th>
                  <th>Type</th>
                  <th>Note</th>
                  <th>Vues</th>
                  <th>En avant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="mh-empty-state">Aucune publication trouvée</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, i) => {
                    const status         = cultureStatus(c);
                    const isBusyApprove  = actionLoading === c._id + '-approve';
                    const isBusyFeatured = actionLoading === c._id + '-featured';
                    const isDeleting     = deletingId === c._id;
                    const meta           = TYPE_META[c.type];

                    return (
                      <tr key={c._id} style={{ opacity: isDeleting ? 0.5 : 1, animationDelay: `${i * 0.04}s` ,borderBottom:"1px solid #30364b"}}>
                        {/* Publication */}
                        <td>
                          <div className="mh-property-thumb">
                            {c.images?.[0] ? (
                              <img className="mh-property-img" src={c.images[0]} alt={c.title} />
                            ) : c.videos?.[0] ? (
                              <div className="mh-property-img-placeholder" style={{ backgroundColor:"white", color: 'red' }}>
                                <Music size={18} />
                              </div>
                            ) : (
                              <div className="mh-property-img-placeholder">
                                <Image size={18} />
                              </div>
                            )}
                            {c.videos && c.videos.length > 0 && (
                              <div style={{ position: 'absolute', top: 4, right: 4, background: 'rgb(248, 248, 248)', color: 'red', borderRadius: 4, padding: '2px 6px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Music size={10} /> {c.videos.length}
                              </div>
                            )}
                            <div>
                              <div className="mh-property-name" style={{ color: '#ffffff' }}>{c.title}</div>
                              {c.name && (
                                <div style={{ fontSize: '0.75rem', color: '#ffffff' }}>{c.name}</div>
                              )}
                              {c.isEditorsPick && (
                                <span className="mh-badge mh-badge-purple" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>
                                  <Star size={9} /> Éditeur
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Author */}
                        <td style={{ color: '#fbfbfb', fontSize: '0.875rem' }}>{getHostName(c.host)}</td>

                        {/* Type */}
                        <td>
                          {meta ? (
                            <span
                              className="mh-badge"
                              style={{
                                background: meta.bg,
                                color: meta.color,
                                border: `1px solid ${meta.color}22`,
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              {meta.icon} {meta.label}
                            </span>
                          ) : (
                            <span className="mh-badge mh-badge-gray">{c.type}</span>
                          )}
                        </td>

                        {/* Rating */}
                        <td>
                          {c.rating > 0 ? (
                            <span className="mh-rating">
                              <Star size={13} fill="currentColor" /> {c.rating.toFixed(1)}
                              <span style={{ fontWeight: 400, color: '#8B9AB5', fontSize: '0.72rem' }}>
                                ({c.reviewCount})
                              </span>
                            </span>
                          ) : (
                            <span style={{ color: '#8B9AB5', fontSize: '0.82rem' }}>—</span>
                          )}
                        </td>

                        {/* Views */}
                        <td>
                          <span className="mh-mono" style={{ color: '#4A5568', fontSize: '0.82rem' }}>
                            {c.views ?? 0}
                          </span>
                        </td>

                        {/* Featured toggle */}
                        <td>
                          {c.isFeatured ? (
                            <button
                              title="Retirer des mis en avant"
                              disabled={isBusyFeatured}
                              onClick={() => handleToggleFeatured(c._id, true)}
                              className="mh-badge mh-badge-purple"
                              style={{ border: 'none', cursor: 'pointer', opacity: isBusyFeatured ? 0.6 : 1 }}
                            >
                              {isBusyFeatured
                                ? <Loader2 size={11} className="mh-spin" />
                                : <Sparkles size={11} />}
                              En avant
                            </button>
                          ) : (
                            <button
                              title="Mettre en avant"
                              disabled={isBusyFeatured}
                              onClick={() => handleToggleFeatured(c._id, false)}
                              style={{
                                background: 'none', border: 'none',
                                color: '#8B9AB5', cursor: 'pointer', fontSize: '0.82rem',
                                display: 'flex', alignItems: 'center', gap: 4,
                                opacity: isBusyFeatured ? 0.6 : 1,
                              }}
                            >
                              {isBusyFeatured ? <Loader2 size={11} className="mh-spin" /> : '—'}
                            </button>
                          )}
                        </td>

                        {/* Status */}
                        <td>
                          <span className={statusBadge[status] || 'mh-badge mh-badge-gray'}>
                            {status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <Link
                              href={`/dashboard/admin/cultureamazigh/${c._id}`}
                              className="mh-icon-btn"
                              title="Modifier"
                            >
                              <Eye size={15} />
                            </Link>

                            {status === 'En attente' && (
                              <button
                                className="mh-icon-btn success"
                                title="Approuver"
                                disabled={isBusyApprove}
                                onClick={() => handleApprove(c._id)}
                              >
                                {isBusyApprove
                                  ? <Loader2 size={14} className="mh-spin" />
                                  : <Check size={14} />}
                              </button>
                            )}

                            <button
                              className="mh-icon-btn danger"
                              title="Supprimer"
                              disabled={isDeleting}
                              onClick={() => setDeleteConfirm(c)}
                            >
                              {isDeleting
                                ? <Loader2 size={14} className="mh-spin" />
                                : <X size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}