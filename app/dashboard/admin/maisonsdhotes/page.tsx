'use client';

import { useEffect, useState } from 'react';
import { useApiToken } from '@/lib/useApiToken';
import Link from 'next/link';
import {
  Plus, Eye, Check, X, Home, Star, Building2, Leaf,
  Search, Loader2, MapPin, ShieldCheck, ShieldOff, Sparkles,
  CalendarDays, Clock, CheckCircle2, XCircle, Users, Trash2,
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

interface Reservation {
  _id: string;
  maison: { _id: string; name: string; location: string; images?: string[] } | null;
  user: { _id: string; name: string; email: string } | null;
  host: { _id: string; name: string; email: string } | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: number;
  currency: string;
  message?: string;
  phone?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

type FilterTab    = 'Tous' | 'Approuvés' | 'En attente' | 'Suspendus' | 'Mis en avant' | "Choix de l'éditeur";
type ResFilterTab = 'Toutes' | 'pending' | 'confirmed' | 'cancelled' | 'completed';
type MainView     = 'maisons' | 'reservations';

// ── Helpers ────────────────────────────────────────────────────────────────
const maisonStatus = (m: Maison): 'Approuvé' | 'En attente' | 'Suspendu' =>
  m.isSuspended ? 'Suspendu' : m.isApproved ? 'Approuvé' : 'En attente';

const statusBadge: Record<string, string> = {
  Approuvé:     'mh-badge mh-badge-success',
  'En attente': 'mh-badge mh-badge-warning',
  Suspendu:     'mh-badge mh-badge-danger',
};

const resStatusMeta: Record<Reservation['status'], { label: string; cls: string; icon: React.ReactNode }> = {
  pending:   { label: 'En attente', cls: 'mh-badge mh-badge-warning', icon: <Clock size={11} /> },
  confirmed: { label: 'Confirmée',  cls: 'mh-badge mh-badge-success', icon: <CheckCircle2 size={11} /> },
  cancelled: { label: 'Annulée',    cls: 'mh-badge mh-badge-danger',  icon: <XCircle size={11} /> },
  completed: { label: 'Terminée',   cls: 'mh-badge mh-badge-gray',    icon: <CheckCircle2 size={11} /> },
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const getHostName = (host: Maison['host']): string => {
  if (!host) return '—';
  if (typeof host === 'string') return host;
  return host.name || '—';
};

// ── Component ──────────────────────────────────────────────────────────────
export default function AdminMaisonsPage() {
  const { apiToken, isLoading: tokenLoading } = useApiToken();

  // ── View toggle ───────────────────────────────────────────────────────────
  const [mainView, setMainView] = useState<MainView>('maisons');

  // ── Maisons state ─────────────────────────────────────────────────────────
  const [maisons, setMaisons]             = useState<Maison[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [search, setSearch]               = useState('');
  const [activeTab, setActiveTab]         = useState<FilterTab>('Tous');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Maison | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  // ── Reservations state ────────────────────────────────────────────────────
  const [reservations, setReservations]           = useState<Reservation[]>([]);
  const [resLoading, setResLoading]               = useState(false);
  const [resError, setResError]                   = useState<string | null>(null);
  const [resSearch, setResSearch]                 = useState('');
  const [resTab, setResTab]                       = useState<ResFilterTab>('Toutes');
  const [resActionLoading, setResActionLoading]   = useState<string | null>(null);
  const [resDeleteConfirm, setResDeleteConfirm]   = useState<Reservation | null>(null);
  const [resDeletingId, setResDeletingId]         = useState<string | null>(null);

  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiToken}`,
  });

  // ── Fetch maisons ─────────────────────────────────────────────────────────
  const fetchMaisons = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/api/maisons-dhotes?limit=100`, { headers: headers() });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setMaisons(data.maisons || []);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Fetch reservations ────────────────────────────────────────────────────
  const fetchReservations = async () => {
    setResLoading(true); setResError(null);
    try {
      const res = await fetch(`${API}/api/reservations?limit=100`, { headers: headers() });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setReservations(data.reservations || []);
    } catch (err: any) { setResError(err.message); }
    finally { setResLoading(false); }
  };

  useEffect(() => {
    if (!apiToken) return;
    fetchMaisons();
    fetchReservations();
  }, [apiToken]);

  // ── Maison actions ────────────────────────────────────────────────────────
  const handleApprove = async (id: string) => {
    setActionLoading(id + '-approve');
    try {
      const res = await fetch(`${API}/api/maisons-dhotes/${id}/approve`, {
        method: 'PATCH', headers: headers(),
      });
      if (!res.ok) throw new Error('Échec');
      await fetchMaisons();
      showSuccessToast("Maison d'hôte approuvée");
    } catch (err: any) { showErrorToast('Erreur', err.message); }
    finally { setActionLoading(null); }
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
    } catch (err: any) { showErrorToast('Erreur', err.message); }
    finally { setActionLoading(null); }
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
      showSuccessToast("Maison d'hôte supprimée");
    } catch (err: any) { showErrorToast('Suppression impossible', err.message); }
    finally { setDeletingId(null); }
  };

  // ── Reservation actions ───────────────────────────────────────────────────
  const handleResStatus = async (id: string, status: Reservation['status']) => {
    setResActionLoading(id + '-' + status);
    try {
      const res = await fetch(`${API}/api/reservations/${id}/status`, {
        method: 'PATCH', headers: headers(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Échec');
      setReservations(prev => prev.map(r => r._id === id ? { ...r, status } : r));
      showSuccessToast('Statut mis à jour');
    } catch (err: any) { showErrorToast('Erreur', err.message); }
    finally { setResActionLoading(null); }
  };

  const handleResDelete = async (id: string) => {
    setResDeletingId(id);
    try {
      const res = await fetch(`${API}/api/reservations/${id}`, {
        method: 'DELETE', headers: headers(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setReservations(prev => prev.filter(r => r._id !== id));
      setResDeleteConfirm(null);
      showSuccessToast('Réservation supprimée');
    } catch (err: any) { showErrorToast('Suppression impossible', err.message); }
    finally { setResDeletingId(null); }
  };

  // ── Maison filter ─────────────────────────────────────────────────────────
  const filtered = maisons.filter(m => {
    const status = maisonStatus(m);
    const matchTab =
      activeTab === 'Tous' ||
      (activeTab === 'Approuvés'           && status === 'Approuvé') ||
      (activeTab === 'En attente'          && status === 'En attente') ||
      (activeTab === 'Suspendus'           && status === 'Suspendu') ||
      (activeTab === 'Mis en avant'        && m.isFeatured) ||
      (activeTab === "Choix de l'éditeur" && m.isEditorsPick);
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.governorate || '').toLowerCase().includes(search.toLowerCase()) ||
      getHostName(m.host).toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  // ── Reservation filter ────────────────────────────────────────────────────
  const filteredRes = reservations.filter(r => {
    const matchTab = resTab === 'Toutes' || r.status === resTab;
    const q = resSearch.toLowerCase();
    const matchSearch =
      !q ||
      (r.maison?.name ?? '').toLowerCase().includes(q) ||
      (r.user?.name  ?? '').toLowerCase().includes(q) ||
      (r.user?.email ?? '').toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const counts = {
    total:     maisons.length,
    approved:  maisons.filter(m => !m.isSuspended && m.isApproved).length,
    pending:   maisons.filter(m => !m.isApproved && !m.isSuspended).length,
    suspended: maisons.filter(m => m.isSuspended).length,
    featured:  maisons.filter(m => m.isFeatured).length,
  };

  const resCounts = {
    all:       reservations.length,
    pending:   reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
    completed: reservations.filter(r => r.status === 'completed').length,
  };

  const isSessionLoading = tokenLoading || (!apiToken);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '0' }}>

      {/* ── Maison delete confirm modal ── */}
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
              <button className="mh-btn mh-btn-secondary" disabled={!!deletingId} onClick={() => setDeleteConfirm(null)}>
                Annuler
              </button>
              <button className="mh-btn mh-btn-danger" disabled={deletingId === deleteConfirm._id} onClick={() => handleDelete(deleteConfirm._id)}>
                {deletingId === deleteConfirm._id
                  ? <><Loader2 size={14} className="mh-spin" /> Suppression…</>
                  : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reservation delete confirm modal ── */}
      {resDeleteConfirm && (
        <div className="mh-modal-overlay" onClick={() => !resDeletingId && setResDeleteConfirm(null)}>
          <div className="mh-modal" onClick={e => e.stopPropagation()}>
            <div className="mh-modal-icon">📅</div>
            <h3 className="mh-modal-title">Supprimer la réservation ?</h3>
            <p className="mh-modal-body">
              Cette action est irréversible. La réservation de{' '}
              <strong>«&nbsp;{resDeleteConfirm.user?.name ?? '—'}&nbsp;»</strong>{' '}
              pour <strong>«&nbsp;{resDeleteConfirm.maison?.name ?? '—'}&nbsp;»</strong>{' '}
              sera définitivement supprimée.
            </p>
            <div className="mh-modal-actions">
              <button className="mh-btn mh-btn-secondary" disabled={!!resDeletingId} onClick={() => setResDeleteConfirm(null)}>
                Annuler
              </button>
              <button className="mh-btn mh-btn-danger" disabled={resDeletingId === resDeleteConfirm._id} onClick={() => handleResDelete(resDeleteConfirm._id)}>
                {resDeletingId === resDeleteConfirm._id
                  ? <><Loader2 size={14} className="mh-spin" /> Suppression…</>
                  : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ── */}
      <div className="mh-page-header mh-anim-fade-up">
        <div>
          <h1 className="mh-page-title">Maisons d'Hôtes</h1>
          <p className="mh-page-subtitle">Gérez les hébergements et les réservations</p>
        </div>
        <div className="mh-header-right">
          {/* ── View toggle ── */}
          <div style={{ display: 'flex', background: '#18203A', borderRadius: 10, padding: 4, gap: 2 }}>
            <button
              onClick={() => setMainView('maisons')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.15s',
                background: mainView === 'maisons' ? '#fff' : 'transparent',
                color:      mainView === 'maisons' ? '#1A202C' : '#8B9AB5',
                boxShadow:  mainView === 'maisons' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Building2 size={14} /> Maisons
            </button>
            <button
              onClick={() => setMainView('reservations')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.15s',
                background: mainView === 'reservations' ? '#fff' : 'transparent',
                color:      mainView === 'reservations' ? '#1A202C' : '#8B9AB5',
                boxShadow:  mainView === 'reservations' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                position: 'relative',
              }}
            >
              <CalendarDays size={14} /> Réservations
              {resCounts.pending > 0 && (
                <span style={{
                  background: '#E53E3E', color: '#fff', borderRadius: '50%',
                  fontSize: '0.65rem', fontWeight: 700,
                  minWidth: 16, height: 16, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                }}>
                  {resCounts.pending}
                </span>
              )}
            </button>
          </div>

          {mainView === 'maisons' && (
            <>
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
            </>
          )}

          {mainView === 'reservations' && (
            <div className="mh-search-wrap">
              <span className="mh-search-icon"><Search size={15} /></span>
              <input
                className="mh-search-input"
                placeholder="Rechercher par maison ou client…"
                value={resSearch}
                onChange={e => setResSearch(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          MAISONS VIEW
      ════════════════════════════════════════ */}
      {mainView === 'maisons' && (
        <>
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
              <button key={t} className={`mh-tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
                {t === 'Mis en avant'        && <Sparkles size={12} />}
                {t === "Choix de l'éditeur" && <Star size={12} />}
                {t}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="mh-card mh-anim-fade-up mh-anim-d3">
            <div className="mh-card-header">
              <h2 className="mh-card-title"><Building2 size={16} /> Catalogue complet</h2>
              <span className="mh-card-hint">{filtered.length} résultat(s)</span>
            </div>

            {(isSessionLoading || loading) && (
              <div className="mh-loading-center"><Loader2 size={22} className="mh-spin" /> Chargement…</div>
            )}
            {!isSessionLoading && !loading && error && (
              <div className="mh-error-state">
                {error}{' '}
                <button className="mh-btn mh-btn-secondary mh-btn-sm" onClick={fetchMaisons}>Réessayer</button>
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
                      <th>En avant</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={8}><div className="mh-empty-state">Aucune maison d'hôte trouvée</div></td></tr>
                    ) : filtered.map((m, i) => {
                      const status         = maisonStatus(m);
                      const isBusyApprove  = actionLoading === m._id + '-approve';
                      const isBusyFeatured = actionLoading === m._id + '-featured';
                      const isDeleting     = deletingId === m._id;

                      return (
                        <tr key={m._id} style={{ opacity: isDeleting ? 0.5 : 1, animationDelay: `${i * 0.04}s` }}>
                          <td>
                            <div className="mh-property-thumb">
                              {m.images?.[0]
                                ? <img className="mh-property-img" src={m.images[0]} alt={m.name} />
                                : <div className="mh-property-img-placeholder"><Building2 size={18} /></div>
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
                          <td style={{ color: '#4A5568', fontSize: '0.875rem' }}>{getHostName(m.host)}</td>
                          <td>
                            {m.type === 'traditionnelle'
                              ? <span className="mh-badge mh-badge-trad"><Leaf size={11} /> Traditionnelle</span>
                              : <span className="mh-badge mh-badge-moderne"><Building2 size={11} /> Moderne</span>
                            }
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: '#4A5568' }}>
                              <MapPin size={12} style={{ color: '#8B9AB5', flexShrink: 0 }} />
                              {m.governorate || m.location || '—'}
                            </div>
                          </td>
                          <td>
                            <span className="mh-mono">
                              {m.pricePerNight?.toLocaleString('fr-FR')} {m.currency || 'TND'}
                            </span>
                          </td>
                          <td>
                            {m.isFeatured ? (
                              <button
                                title="Retirer des mis en avant" disabled={isBusyFeatured}
                                onClick={() => handleToggleFeatured(m._id, true)}
                                className="mh-badge mh-badge-purple"
                                style={{ border: 'none', cursor: 'pointer', opacity: isBusyFeatured ? 0.6 : 1 }}
                              >
                                {isBusyFeatured ? <Loader2 size={11} className="mh-spin" /> : <Sparkles size={11} />}
                                En avant
                              </button>
                            ) : (
                              <button
                                title="Mettre en avant" disabled={isBusyFeatured}
                                onClick={() => handleToggleFeatured(m._id, false)}
                                style={{ background: 'none', border: 'none', color: '#8B9AB5', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4, opacity: isBusyFeatured ? 0.6 : 1 }}
                              >
                                {isBusyFeatured ? <Loader2 size={11} className="mh-spin" /> : '—'}
                              </button>
                            )}
                          </td>
                          <td>
                            <span className={statusBadge[status] || 'mh-badge mh-badge-gray'}>{status}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <Link href={`/dashboard/admin/maisonsdhotes/${m._id}`} className="mh-icon-btn" title="Modifier">
                                <Eye size={15} />
                              </Link>
                              {status === 'En attente' && (
                                <button className="mh-icon-btn success" title="Approuver" disabled={isBusyApprove} onClick={() => handleApprove(m._id)}>
                                  {isBusyApprove ? <Loader2 size={14} className="mh-spin" /> : <Check size={14} />}
                                </button>
                              )}
                              <button className="mh-icon-btn danger" title="Supprimer" disabled={isDeleting} onClick={() => setDeleteConfirm(m)}>
                                {isDeleting ? <Loader2 size={14} className="mh-spin" /> : <X size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════
          RESERVATIONS VIEW
      ════════════════════════════════════════ */}
      {mainView === 'reservations' && (
        <>
          {/* Reservation stats */}
          <div className="mh-stats-grid">
            {[
              { label: 'Total',      val: resCounts.all,       color: '#0234AB' },
              { label: 'En attente', val: resCounts.pending,   color: '#D97706' },
              { label: 'Confirmées', val: resCounts.confirmed, color: '#0B9E5E' },
              { label: 'Annulées',   val: resCounts.cancelled, color: '#E53E3E' },
              { label: 'Terminées',  val: resCounts.completed, color: '#6B46C1' },
            ].map((s, i) => (
              <div key={s.label} className={`mh-stat-card mh-anim-fade-up mh-anim-d${i + 1}`}>
                <div className="mh-stat-label">{s.label}</div>
                <div className="mh-stat-value" style={{ color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Reservation tabs */}
          <div className="mh-tabs">
            {(['Toutes', 'pending', 'confirmed', 'cancelled', 'completed'] as ResFilterTab[]).map(t => {
              const labels: Record<ResFilterTab, string> = {
                Toutes: 'Toutes', pending: 'En attente',
                confirmed: 'Confirmées', cancelled: 'Annulées', completed: 'Terminées',
              };
              return (
                <button key={t} className={`mh-tab${resTab === t ? ' active' : ''}`} onClick={() => setResTab(t)}>
                  {labels[t]}
                  {t === 'pending' && resCounts.pending > 0 && (
                    <span style={{
                      background: '#E53E3E', color: '#fff', borderRadius: 20,
                      fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', marginLeft: 4,
                    }}>
                      {resCounts.pending}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Reservations table */}
          <div className="mh-card mh-anim-fade-up mh-anim-d3">
            <div className="mh-card-header">
              <h2 className="mh-card-title"><CalendarDays size={16} /> Toutes les réservations</h2>
              <span className="mh-card-hint">{filteredRes.length} résultat(s)</span>
            </div>

            {resLoading && (
              <div className="mh-loading-center"><Loader2 size={22} className="mh-spin" /> Chargement…</div>
            )}
            {!resLoading && resError && (
              <div className="mh-error-state">
                {resError}{' '}
                <button className="mh-btn mh-btn-secondary mh-btn-sm" onClick={fetchReservations}>Réessayer</button>
              </div>
            )}

            {!resLoading && !resError && (
              <div className="mh-table-wrap">
                <table className="mh-table">
                  <thead>
                    <tr>
                      <th>Maison</th>
                      <th>Client</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Nuits</th>
                      <th>Voyageurs</th>
                      <th>Total</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRes.length === 0 ? (
                      <tr><td colSpan={9}><div className="mh-empty-state">Aucune réservation trouvée</div></td></tr>
                    ) : filteredRes.map((r, i) => {
                      const meta   = resStatusMeta[r.status];
                      const isBusy = (s: string) => resActionLoading === r._id + '-' + s;

                      return (
                        <tr key={r._id} style={{ opacity: resDeletingId === r._id ? 0.5 : 1, animationDelay: `${i * 0.04}s` }}>

                          {/* Maison */}
                          <td>
                            <div className="mh-property-thumb">
                              {r.maison?.images?.[0]
                                ? <img className="mh-property-img" src={r.maison.images[0]} alt={r.maison.name} />
                                : <div className="mh-property-img-placeholder"><Building2 size={16} /></div>
                              }
                              <div>
                                <div className="mh-property-name">{r.maison?.name ?? '—'}</div>
                                <div style={{ fontSize: '0.72rem', color: '#8B9AB5' }}>{r.maison?.location ?? ''}</div>
                              </div>
                            </div>
                          </td>

                          {/* Client */}
                          <td>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2D3748' }}>
                              {r.user?.name ?? '—'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#8B9AB5' }}>{r.user?.email ?? ''}</div>
                            {r.phone && <div style={{ fontSize: '0.72rem', color: '#8B9AB5' }}>{r.phone}</div>}
                          </td>

                          {/* Dates */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem' }}>
                              <CalendarDays size={12} style={{ color: '#8B9AB5' }} />
                              {fmt(r.checkIn)}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem' }}>
                              <CalendarDays size={12} style={{ color: '#8B9AB5' }} />
                              {fmt(r.checkOut)}
                            </div>
                          </td>

                          {/* Nights */}
                          <td><span className="mh-mono">{r.nights}</span></td>

                          {/* Guests */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', color: '#4A5568' }}>
                              <Users size={12} style={{ color: '#8B9AB5' }} /> {r.guests}
                            </div>
                          </td>

                          {/* Total */}
                          <td>
                            <span className="mh-mono" style={{ fontWeight: 700, color: '#1A202C' }}>
                              {r.totalPrice.toLocaleString('fr-FR')} {r.currency}
                            </span>
                          </td>

                          {/* Status */}
                          <td>
                            <span className={meta.cls} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {meta.icon} {meta.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td>
                            <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>

                              {/* pending: confirm + cancel */}
                              {r.status === 'pending' && (
                                <>
                                  <button
                                    className="mh-icon-btn success" title="Confirmer"
                                    disabled={!!resActionLoading || !!resDeletingId}
                                    onClick={() => handleResStatus(r._id, 'confirmed')}
                                  >
                                    {isBusy('confirmed') ? <Loader2 size={13} className="mh-spin" /> : <Check size={13} />}
                                  </button>
                                  <button
                                    className="mh-icon-btn danger" title="Refuser"
                                    disabled={!!resActionLoading || !!resDeletingId}
                                    onClick={() => handleResStatus(r._id, 'cancelled')}
                                  >
                                    {isBusy('cancelled') ? <Loader2 size={13} className="mh-spin" /> : <X size={13} />}
                                  </button>
                                </>
                              )}

                              {/* confirmed: complete + cancel */}
                              {r.status === 'confirmed' && (
                                <>
                                  <button
                                    className="mh-icon-btn success" title="Marquer terminée"
                                    style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: 7, width: 'auto' }}
                                    disabled={!!resActionLoading || !!resDeletingId}
                                    onClick={() => handleResStatus(r._id, 'completed')}
                                  >
                                    {isBusy('completed') ? <Loader2 size={13} className="mh-spin" /> : <CheckCircle2 size={13} />}
                                  </button>
                                  <button
                                    className="mh-icon-btn danger" title="Annuler"
                                    disabled={!!resActionLoading || !!resDeletingId}
                                    onClick={() => handleResStatus(r._id, 'cancelled')}
                                  >
                                    {isBusy('cancelled') ? <Loader2 size={13} className="mh-spin" /> : <X size={13} />}
                                  </button>
                                </>
                              )}

                              {/* delete — always visible */}
                              <button
                                className="mh-icon-btn danger" title="Supprimer définitivement"
                                disabled={!!resDeletingId || !!resActionLoading}
                                onClick={() => setResDeleteConfirm(r)}
                              >
                                {resDeletingId === r._id
                                  ? <Loader2 size={13} className="mh-spin" />
                                  : <Trash2 size={13} />}
                              </button>

                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}