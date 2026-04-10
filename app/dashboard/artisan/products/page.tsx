'use client';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import type { ComponentType } from 'react';
import { useSession } from 'next-auth/react';
import { Axe, Package, Search, Shirt, ShoppingBag, Lamp, Sparkles, Plus, Pencil, X, Loader2 } from 'lucide-react';

// ── Config ────────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
  isApproved: boolean;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusLabel = (p: Product) =>
  !p.isApproved ? 'En attente' : p.stock === 0 ? 'Inactif' : 'Actif';

const statusBadge = (s: string) =>
  s === 'Actif' ? 'badge-success' : s === 'En attente' ? 'badge-warning' : 'badge-gray';

const categoryIcon: Record<string, ComponentType<{ size?: number }>> = {
  fokhar:  Package,
  margoum: Shirt,
  tissage: ShoppingBag,
  bijoux:  Sparkles,
  Bois:    Axe,
  Métal:   Lamp,
};

const TABS = ['Tous', 'Actif', 'En attente', 'Inactif'] as const;
type Tab = (typeof TABS)[number];

// ── Component ─────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [activeTab, setActiveTab]   = useState<Tab>('Tous');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getHeaders = () => ({ Authorization: `Bearer ${apiToken}` });

  // ── Fetch ──────────────────────────────────────────────────────────────────
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

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      setDeletingId(id);
      const res = await fetch(`${API}/api/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = products.filter(p => {
    const label       = statusLabel(p);
    const matchTab    = activeTab === 'Tous' || label === activeTab;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const isSessionLoading =
    sessionStatus === 'loading' || (!apiToken && sessionStatus === 'authenticated');

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Mes Produits</h1>
          <p className="page-subtitle">
            {loading ? '…' : `${products.length} produit${products.length !== 1 ? 's' : ''} dans votre catalogue`}
          </p>
        </div>
        <div className="header-actions-row">
          <div className="search-bar">
            <span className="search-bar-icon" aria-hidden="true"><Search size={16} /></span>
            <input
              className="search-bar-input"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Link href="/dashboard/artisan/products/create" className="btn btn-primary">
            <Plus size={16} style={{ marginRight: 8 }} aria-hidden="true" />
            Nouveau produit
          </Link>
        </div>
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
          </button>
        ))}
      </div>

      {/* Session / data loading */}
      {(isSessionLoading || loading) && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', opacity: 0.5 }} />
        </div>
      )}

      {/* Error */}
      {!isSessionLoading && !loading && error && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-error,#e53e3e)' }}>
          <p>{error}</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={fetchProducts}>
            Réessayer
          </button>
        </div>
      )}

      {/* Empty */}
      {!isSessionLoading && !loading && !error && filtered.length === 0 && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', opacity: 0.6 }}>
          <Package size={40} style={{ margin: '0 auto 1rem' }} />
          <p>Aucun produit trouvé.</p>
        </div>
      )}

      {/* Grid */}
      {!isSessionLoading && !loading && !error && filtered.length > 0 && (
        <div className="products-grid">
          {filtered.map((p, i) => {
            const Icon       = categoryIcon[p.category] ?? Package;
            const label      = statusLabel(p);
            const isDeleting = deletingId === p._id;

            return (
              <div
                key={p._id}
                className="product-card anim-fade-up"
                style={{ animationDelay: `${i * 0.07}s`, opacity: isDeleting ? 0.5 : 1 }}
              >
                {/* Thumbnail */}
                <div className="product-card-image">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="product-card-image-inner"><Icon size={22} /></div>
                  )}
                  <div className="product-card-status">
                    <span className={`badge ${statusBadge(label)}`}>{label}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="product-card-body">
                  <div className="product-card-cat">{p.category}</div>
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
                      <Pencil size={14} style={{ marginRight: 6 }} aria-hidden="true" />
                      Modifier
                    </Link>
                    <button
                      className="product-delete-btn"
                      aria-label="Supprimer"
                      disabled={isDeleting}
                      onClick={() => handleDelete(p._id)}
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