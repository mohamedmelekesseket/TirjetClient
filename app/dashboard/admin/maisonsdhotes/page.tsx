'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Plus, Eye, Check, X, Home, Star, Building2, Leaf,
  Search, Loader2, MapPin, ShieldCheck, ShieldOff, Sparkles,
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/lib/toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Types ──────────────────────────────────────────────────────────────────
interface Maison {
  _id: string;
  name: string;
  type: 'traditionnelle' | 'moderne';
  location: string;
  governorate?: string;
  pricePerNight: number;
  currency: string;
  rating: number;
  reviewCount: number;
  images: string[];
  isApproved: boolean;
  isSuspended: boolean;
  isEditorsPick: boolean;
  isFeatured: boolean;
  host: { _id: string; name: string; email: string } | null;
  views: number;
  createdAt: string;
}

type FilterTab = 'Tous' | 'Approuvés' | 'En attente' | 'Suspendus' | 'Mis en avant' | "Choix de l'éditeur";

// ── Helpers ────────────────────────────────────────────────────────────────
const maisonStatus = (m: Maison): 'Approuvé' | 'En attente' | 'Suspendu' =>
  m.isSuspended ? 'Suspendu' : m.isApproved ? 'Approuvé' : 'En attente';

const statusBadge: Record<string, string> = {
  Approuvé: 'mh-badge mh-badge-success',
  'En attente': 'mh-badge mh-badge-warning',
  Suspendu: 'mh-badge mh-badge-danger',
};

const getHostName = (host: Maison['host']): string => {
  if (!host) return '—';
  if (typeof host === 'string') return host;
  return host.name || '—';
};

// ── Component ──────────────────────────────────────────────────────────────
export default function AdminMaisonsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [maisons, setMaisons] = useState<Maison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('Tous');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Maison | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiToken}`,
  });

  const fetchMaisons = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/maisons-dhotes?limit=100`, { headers: headers() });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setMaisons(data.maisons || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (apiToken) fetchMaisons(); }, [apiToken]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleApprove = async (id: string) => {
    setActionLoading(id + '-approve');
    try {
      const res = await fetch(`${API}/api/maisons-dhotes/${id}/approve`, {
        method: 'PATCH', headers: headers(),
      });
      if (!res.ok) throw new Error('Échec');
      await fetchMaisons();
      showSuccessToast('Maison d\'hôte approuvée');
    } catch (err: any) {
      showErrorToast('Erreur', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    setActionLoading(id + '-featured');
    try {
      const res = await fetch(`${API}/api/maisons-dhotes/${id}`, {
        method: 'PUT', headers: headers(),
        body: JSON.stringify({ isFeatured: !current }),
      });
      if (!res.ok) throw new Error('Échec');
      setMaisons(prev => prev.map(m => m._id === id ? { ...m, isFeatured: !current } : m));
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
      const res = await fetch(`${API}/api/maisons-dhotes/${id}`, {
        method: 'DELETE', headers: headers(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setMaisons(prev => prev.filter(m => m._id !== id));
      setDeleteConfirm(null);
      showSuccessToast('Maison d\'hôte supprimée');
    } catch (err: any) {
      showErrorToast('Suppression impossible', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = maisons.filter(m => {
    const status = maisonStatus(m);
    const matchTab =
      activeTab === 'Tous' ||
      (activeTab === 'Approuvés'            && status === 'Approuvé') ||
      (activeTab === 'En attente'           && status === 'En attente') ||
      (activeTab === 'Suspendus'            && status === 'Suspendu') ||
      (activeTab === 'Mis en avant'         && m.isFeatured) ||
      (activeTab === "Choix de l'éditeur"  && m.isEditorsPick);
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.governorate || '').toLowerCase().includes(search.toLowerCase()) ||
      getHostName(m.host).toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    total:       maisons.length,
    approved:    maisons.filter(m => !m.isSuspended && m.isApproved).length,
    pending:     maisons.filter(m => !m.isApproved && !m.isSuspended).length,
    suspended:   maisons.filter(m => m.isSuspended).length,
    featured:    maisons.filter(m => m.isFeatured).length,
    editorsPick: maisons.filter(m => m.isEditorsPick).length,
  };

  const isSessionLoading = sessionStatus === 'loading' || (!apiToken && sessionStatus === 'authenticated');

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="mh-modal-overlay" onClick={() => !deletingId && setDeleteConfirm(null)}>
          <div className="mh-modal" onClick={e => e.stopPropagation()}>
            <div className="mh-modal-icon">🏡</div>
            <h3 className="mh-modal-title">Supprimer la maison d'hôte ?</h3>
            <p className="mh-modal-body">
              Cette action est irréversible.{' '}
              <strong>«&nbsp;{deleteConfirm.name}&nbsp;»</strong> sera définitivement supprimée.
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
          <h1 className="mh-page-title">Maisons d'Hôtes</h1>
          <p className="mh-page-subtitle">Gérez et modérez les hébergements de la plateforme</p>
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
          <Link href="/dashboard/admin/maisonsdhotes/create" className="mh-btn mh-btn-primary">
            <Plus size={15} /> Nouvelle maison
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mh-stats-grid">
        {[
          { label: 'Total',          val: counts.total,       color: '#0234AB' },
          { label: 'Approuvées',     val: counts.approved,    color: '#0B9E5E' },
          { label: 'En attente',     val: counts.pending,     color: '#D97706' },
          { label: 'Suspendues',     val: counts.suspended,   color: '#E53E3E' },
          { label: 'Mis en avant',   val: counts.featured,    color: '#6B46C1' },
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
            {t === 'Mis en avant' && <Sparkles size={12} />}
            {t === "Choix de l'éditeur" && <Star size={12} />}
            {t}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="mh-card mh-anim-fade-up mh-anim-d3">
        <div className="mh-card-header">
          <h2 className="mh-card-title">
            <Building2 size={16} /> Catalogue complet
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
            <button className="mh-btn mh-btn-secondary mh-btn-sm" onClick={fetchMaisons}>
              Réessayer
            </button>
          </div>
        )}

        {!isSessionLoading && !loading && !error && (
          <div className="mh-table-wrap">
            <table className="mh-table">
              <thead>
                <tr>
                  <th>Maison</th>
                  <th>Hôte</th>
                  <th>Type</th>
                  <th>Localisation</th>
                  <th>Prix / nuit</th>
                  <th>Note</th>
                  <th>En avant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="mh-empty-state">Aucune maison d'hôte trouvée</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((m, i) => {
                    const status = maisonStatus(m);
                    const isBusyApprove  = actionLoading === m._id + '-approve';
                    const isBusyFeatured = actionLoading === m._id + '-featured';
                    const isDeleting     = deletingId === m._id;

                    return (
                      <tr key={m._id} style={{ opacity: isDeleting ? 0.5 : 1, animationDelay: `${i * 0.04}s` }}>
                        {/* Property */}
                        <td>
                          <div className="mh-property-thumb">
                            {m.images?.[0]
                              ? <img className="mh-property-img" src={m.images[0]} alt={m.name} />
                              : (
                                <div className="mh-property-img-placeholder">
                                  <Building2 size={18} />
                                </div>
                              )
                            }
                            <div>
                              <div className="mh-property-name">{m.name}</div>
                              {m.isEditorsPick && (
                                <span className="mh-badge mh-badge-purple" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>
                                  <Star size={9} /> Éditeur
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Host */}
                        <td style={{ color: '#4A5568', fontSize: '0.875rem' }}>{getHostName(m.host)}</td>

                        {/* Type */}
                        <td>
                          {m.type === 'traditionnelle'
                            ? <span className="mh-badge mh-badge-trad"><Leaf size={11} /> Traditionnelle</span>
                            : <span className="mh-badge mh-badge-moderne"><Building2 size={11} /> Moderne</span>
                          }
                        </td>

                        {/* Location */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: '#4A5568' }}>
                            <MapPin size={12} style={{ color: '#8B9AB5', flexShrink: 0 }} />
                            {m.governorate || m.location || '—'}
                          </div>
                        </td>

                        {/* Price */}
                        <td>
                          <span className="mh-mono">
                            {m.pricePerNight?.toLocaleString('fr-FR')} {m.currency || 'TND'}
                          </span>
                        </td>

                        {/* Rating */}
                        <td>
                          {m.rating > 0
                            ? (
                              <span className="mh-rating">
                                <Star size={13} fill="currentColor" /> {m.rating.toFixed(1)}
                                <span style={{ fontWeight: 400, color: '#8B9AB5', fontSize: '0.72rem' }}>
                                  ({m.reviewCount})
                                </span>
                              </span>
                            )
                            : <span style={{ color: '#8B9AB5', fontSize: '0.82rem' }}>—</span>
                          }
                        </td>

                        {/* Featured toggle */}
                        <td>
                          {m.isFeatured ? (
                            <button
                              title="Retirer des mis en avant"
                              disabled={isBusyFeatured}
                              onClick={() => handleToggleFeatured(m._id, true)}
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
                              onClick={() => handleToggleFeatured(m._id, false)}
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
                              href={`/dashboard/admin/maisonsdhotes/${m._id}`}
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
                                onClick={() => handleApprove(m._id)}
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
                              onClick={() => setDeleteConfirm(m)}
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