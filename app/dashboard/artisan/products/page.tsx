'use client';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Package, Search, Plus, Pencil, X, Loader2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  subcategory?: { slug: string; name: string };
  stock: number;
  isApproved: boolean;
  createdAt: string;
}

const statusLabel = (p: Product) =>
  !p.isApproved ? 'En attente' : p.stock === 0 ? 'Inactif' : 'Actif';

const statusBadge = (s: string) =>
  s === 'Actif' ? 'badge-success' : s === 'En attente' ? 'badge-warning' : 'badge-gray';

const TABS = ['Tous', 'Actif', 'En attente', 'Inactif'] as const;
type Tab = (typeof TABS)[number];

export default function ProductsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [products, setProducts]         = useState<Product[]>([]);
  const [categoryMap, setCategoryMap]   = useState<Record<string, string>>({});
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [activeTab, setActiveTab]       = useState<Tab>('Tous');
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);

  const getHeaders = () => ({ Authorization: `Bearer ${apiToken}` });

  // fetch categories for name lookup
  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.data) {
          const map: Record<string, string> = {};
          data.data.forEach((c: any) => { map[c._id] = c.name; });
          setCategoryMap(map);
        }
      })
      .catch(() => {});
  }, []);

  // fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/api/products/mine`, { headers: getHeaders() });
      if (res.status === 401) throw new Error('Non autorisé — session expirée ?');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products ?? data.data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiToken]);

  useEffect(() => {
    if (apiToken) fetchProducts();
  }, [apiToken, fetchProducts]);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await fetch(`${API}/api/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter(p => {
    const label       = statusLabel(p);
    const matchTab    = activeTab === 'Tous' || label === activeTab;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    Tous:       products.length,
    Actif:      products.filter(p => statusLabel(p) === 'Actif').length,
    'En attente': products.filter(p => statusLabel(p) === 'En attente').length,
    Inactif:    products.filter(p => statusLabel(p) === 'Inactif').length,
  };

  const isSessionLoading =
    sessionStatus === 'loading' || (!apiToken && sessionStatus === 'authenticated');

  return (
    <div>
      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div
          onClick={() => setDeleteConfirm(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 16, padding: 32,
              maxWidth: 400, width: '100%', textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.1rem', fontWeight: 700 }}>
              Supprimer le produit ?
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#4a5568', marginBottom: 24, lineHeight: 1.5 }}>
              Cette action est irréversible.{' '}
              <strong>«&nbsp;{deleteConfirm.title}&nbsp;»</strong> sera définitivement supprimé.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
                  background: '#f8fafc', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm._id)}
                disabled={deletingId === deleteConfirm._id}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none',
                  background: '#e53e3e', color: '#fff', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.875rem',
                  display: 'flex', alignItems: 'center', gap: 8,
                  opacity: deletingId === deleteConfirm._id ? 0.7 : 1,
                }}
              >
                {deletingId === deleteConfirm._id
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Suppression…</>
                  : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Mes Produits</h1>
          <p className="page-subtitle">
            {loading ? '…' : `${products.length} produit${products.length !== 1 ? 's' : ''} dans votre catalogue`}
          </p>
        </div>
        <div className="header-actions-row">
          <div className="search-bar">
            <span className="search-bar-icon"><Search size={16} /></span>
            <input
              className="search-bar-input"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B9AB5', padding: '0 8px' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Link href="/dashboard/artisan/products/create" className="btn btn-primary">
            <Plus size={16} style={{ marginRight: 8 }} />
            Nouveau produit
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="dash-kpi-4">
        {(TABS).map((t, i) => (
          <div
            key={t}
            className="order-stat-mini anim-fade-up"
            style={{ animationDelay: `${i * 0.07}s`, cursor: 'pointer' }}
            onClick={() => setActiveTab(t)}
          >
            <div className="order-stat-mini-label">{t.toUpperCase()}</div>
            <div className="order-stat-mini-value" style={{
              color: t === 'Actif' ? '#0B9E5E' : t === 'En attente' ? '#F59E0B' : t === 'Inactif' ? '#E53E3E' : '#0234AB'
            }}>
              {counts[t]}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`tab${activeTab === t ? ' active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
            <span style={{
              marginLeft: 6, fontSize: '0.75rem', background: activeTab === t ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
              color: activeTab === t ? 'inherit' : '#8B9AB5',
              padding: '1px 7px', borderRadius: 20, fontWeight: 600,
            }}>
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* Session loading */}
      {(isSessionLoading || loading) && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', opacity: 0.4 }} />
        </div>
      )}

      {/* Error */}
      {!isSessionLoading && !loading && error && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#e53e3e' }}>
          <p>{error}</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={fetchProducts}>
            Réessayer
          </button>
        </div>
      )}

      {/* Empty */}
      {!isSessionLoading && !loading && !error && filtered.length === 0 && (
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
          <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
          <p style={{ color: '#8B9AB5', marginBottom: 16 }}>
            {search ? `Aucun résultat pour "${search}"` : 'Aucun produit trouvé.'}
          </p>
          {!search && (
            <Link href="/dashboard/artisan/products/create" className="btn btn-primary">
              <Plus size={16} style={{ marginRight: 8 }} />
              Créer mon premier produit
            </Link>
          )}
        </div>
      )}

      {/* Products grid */}
      {!isSessionLoading && !loading && !error && filtered.length > 0 && (
        <div className="products-grid">
          {filtered.map((p, i) => {
            const label      = statusLabel(p);
            const isDeleting = deletingId === p._id;
            const catName    = categoryMap[p.category] ?? p.category;

            return (
              <div
                key={p._id}
                className="product-card anim-fade-up"
                style={{ animationDelay: `${i * 0.06}s`, opacity: isDeleting ? 0.5 : 1 }}
              >
                {/* Thumbnail */}
                <div className="product-card-image">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]} alt={p.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="product-card-image-inner">
                      <Package size={28} style={{ opacity: 0.3 }} />
                    </div>
                  )}
                  <div className="product-card-status">
                    <span className={`badge ${statusBadge(label)}`}>{label}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="product-card-body">
                  {/* Category + subcategory */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span className="product-card-cat">{catName}</span>
                    {p.subcategory?.name && (
                      <>
                        <span style={{ color: '#cbd5e0', fontSize: '0.7rem' }}>›</span>
                        <span style={{ fontSize: '0.72rem', color: '#8B9AB5', fontWeight: 500 }}>
                          {p.subcategory.name}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="product-card-name">{p.title}</div>
                  <div className="product-card-price">{p.price.toLocaleString('fr-FR')} TND</div>

                  <div className="product-card-meta">
                    <div className="product-card-meta-item">
                      <span className="product-card-meta-label">Stock</span>
                      <span className={`product-card-meta-val${p.stock < 5 ? ' low' : ''}`}>
                        {p.stock}
                      </span>
                    </div>
                    <div className="product-card-meta-item">
                      <span className="product-card-meta-label">Statut</span>
                      <span className="product-card-meta-val">{label}</span>
                    </div>
                  </div>

                  <div className="product-card-actions">
                    <Link
                      href={`/dashboard/artisan/products/${p._id}/edit`}
                      className="product-edit-btn"
                    >
                      <Pencil size={14} style={{ marginRight: 6 }} />
                      Modifier
                    </Link>
                    <button
                      className="product-delete-btn"
                      aria-label="Supprimer"
                      disabled={isDeleting}
                      onClick={() => setDeleteConfirm(p)}
                    >
                      {isDeleting
                        ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        : <X size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}