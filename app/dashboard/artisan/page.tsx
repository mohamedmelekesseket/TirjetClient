'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Loader2, Package, ShoppingCart, TrendingUp, Eye, Plus, AlertTriangle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Product {
  _id: string;
  title: string;
  price: number;
  stock: number;
  isApproved: boolean;
  isSuspended: boolean;
  category?: { name: string } | string;
  images?: string[];
  createdAt: string;
}

interface Order {
  _id: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  user?: { name: string };
  items?: { product: { title: string } }[];
}

interface Stats {
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  views: number;
  pendingOrders: number;
  suspendedProducts: number;
}

export default function ArtisanDashboard() {
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;
  const userName = (session as any)?.user?.name ?? 'Artisan';

  const [stats, setStats] = useState<Stats>({
    totalProducts: 0, totalOrders: 0, revenue: 0,
    views: 0, pendingOrders: 0, suspendedProducts: 0,
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = useCallback(() => ({
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  }), [apiToken]);

  const fetchAll = useCallback(async () => {
    if (!apiToken) return;
    try {
      setLoading(true);
      const [productsRes, ordersRes] = await Promise.all([
        fetch(`${API}/api/products/mine?limit=50`, { headers: headers() }),
        fetch(`${API}/api/orders/artisan?limit=20`, { headers: headers() }),
      ]);

      const [productsData, ordersData] = await Promise.all([
        productsRes.ok ? productsRes.json() : null,
        ordersRes.ok ? ordersRes.json() : null,
      ]);

      const products: Product[] = productsData?.products ?? productsData?.data ?? [];
      const orders: Order[] = ordersData?.orders ?? ordersData?.data ?? [];

      const revenue = orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const suspendedProducts = products.filter(p => p.isSuspended).length;

      setStats({
        totalProducts: productsData?.total ?? products.length,
        totalOrders: ordersData?.total ?? orders.length,
        revenue,
        views: 0,
        pendingOrders,
        suspendedProducts,
      });

      setRecentProducts(products.slice(0, 5));
      setRecentOrders(orders.slice(0, 5));
    } catch (err) {
      console.error('Artisan dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiToken, headers]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getCategoryName = (cat: Product['category']) => {
    if (!cat) return '—';
    if (typeof cat === 'string') return cat;
    return cat.name ?? '—';
  };

  const orderStatusColor: Record<string, string> = {
    delivered: '#0B9E5E', pending: '#F59E0B', processing: '#0234AB',
    cancelled: '#E53E3E', shipped: '#8B5CF6',
  };
  const orderStatusLabel: Record<string, string> = {
    delivered: 'Livré', pending: 'En attente', processing: 'En cours',
    cancelled: 'Annulé', shipped: 'Expédié',
  };

  const statCards = [
    { icon: <Package size={20} />, label: 'Produits', value: stats.totalProducts, color: '#0234AB', href: '/dashboard/artisan/products' },
    { icon: <ShoppingCart size={20} />, label: 'Commandes', value: stats.totalOrders, color: '#0B9E5E', href: '/dashboard/artisan/orders' },
    { icon: <TrendingUp size={20} />, label: 'Revenus', value: `${stats.revenue.toLocaleString()} TND`, color: '#F5A623', href: null },
    { icon: <Eye size={20} />, label: 'Vues', value: stats.views || '—', color: '#8B5CF6', href: null },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5rem', gap: 12 }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#0234AB' }} />
      <span style={{ color: '#8B9AB5' }}>Chargement…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div className="page-header anim-fade-up">
        <div>
          <div className="page-greeting">Bonjour, {userName} ✦</div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Aperçu de vos activités du jour</p>
        </div>
        <Link href="/dashboard/artisan/products/create" className="btn btn-primary btn-lg">
          <Plus size={16} /> Nouveau Produit
        </Link>
      </div>

      {/* Alerts */}
      {(stats.pendingOrders > 0 || stats.suspendedProducts > 0) && (
        <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {stats.pendingOrders > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, fontSize: '0.83rem', color: '#92400e' }}>
              <ShoppingCart size={15} /> <strong>{stats.pendingOrders}</strong> commande(s) en attente
              <Link href="/dashboard/artisan/orders" style={{ color: '#0234AB', fontWeight: 600, marginLeft: 4 }}>Voir →</Link>
            </div>
          )}
          {stats.suspendedProducts > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 10, fontSize: '0.83rem', color: '#c53030' }}>
              <AlertTriangle size={15} /> <strong>{stats.suspendedProducts}</strong> produit(s) suspendu(s)
              <Link href="/dashboard/artisan/products" style={{ color: '#0234AB', fontWeight: 600, marginLeft: 4 }}>Voir →</Link>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="card anim-fade-up" style={{ animationDelay: `${i * 0.06}s`, padding: '20px 22px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}18`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              {s.icon}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0A0F2C', letterSpacing: '-0.5px' }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#8B9AB5', marginTop: 2 }}>{s.label}</div>
            {s.href && (
              <Link href={s.href} style={{ fontSize: '0.75rem', color: s.color, marginTop: 8, display: 'inline-block', fontWeight: 600 }}>
                Gérer →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="artisan-home-grid">

        {/* Products table */}
        <div className="card anim-fade-up anim-d3">
          <div className="card-header">
            <h2 className="card-title">Mes produits récents</h2>
            <Link href="/dashboard/artisan/products" className="see-all">Voir tout →</Link>
          </div>
          {recentProducts.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center' }}>
              <Package size={36} style={{ color: '#8B9AB5', margin: '0 auto 12px', display: 'block' }} />
              <div style={{ color: '#8B9AB5', fontSize: '0.85rem', marginBottom: 12 }}>Aucun produit pour le moment</div>
              <Link href="/dashboard/artisan/products/create" className="btn btn-primary btn-sm">
                <Plus size={14} /> Créer un produit
              </Link>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Prix</th>
                    <th>Stock</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="product-cell">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.title}
                              style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div className="product-cell-dot" style={{ background: '#0234AB' }} />
                          )}
                          <div>
                            <Link href={`/dashboard/artisan/products/${p._id}/edit`}
                              style={{ fontWeight: 600, fontSize: '0.83rem', color: '#0A0F2C', textDecoration: 'none' }}>
                              {p.title}
                            </Link>
                            <div className="product-cell-cat">{getCategoryName(p.category)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '0.8rem' }}>{p.price} TND</td>
                      <td style={{ fontSize: '0.8rem', color: p.stock === 0 ? '#e53e3e' : '#0A0F2C', fontWeight: p.stock === 0 ? 700 : 400 }}>
                        {p.stock === 0 ? 'Épuisé' : p.stock}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: p.isSuspended ? '#fff5f5' : p.isApproved ? '#f0fff4' : '#fffbeb', color: p.isSuspended ? '#e53e3e' : p.isApproved ? '#0B9E5E' : '#F59E0B' }}>
                          {p.isSuspended ? 'Suspendu' : p.isApproved ? 'Actif' : 'En attente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="artisan-home-right">

          {/* Recent orders */}
          <div className="card anim-fade-up anim-d4">
            <div className="card-header">
              <h2 className="card-title">Commandes récentes</h2>
              <Link href="/dashboard/artisan/orders" className="see-all">Voir tout →</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#8B9AB5', fontSize: '0.85rem' }}>Aucune commande</div>
            ) : recentOrders.map((o) => (
              <div key={o._id} className="order-item">
                <div>
                  <div className="order-id">#{o._id.slice(-6).toUpperCase()}</div>
                  <div className="order-product">{o.items?.[0]?.product?.title ?? 'Commande'}</div>
                  <div className="order-customer">→ {o.user?.name ?? 'Client'}</div>
                </div>
                <div className="order-right">
                  <div className="order-amount">{(o.totalPrice ?? 0).toLocaleString()} TND</div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: `${orderStatusColor[o.status] ?? '#8B9AB5'}18`, color: orderStatusColor[o.status] ?? '#8B9AB5' }}>
                    {orderStatusLabel[o.status] ?? o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="card anim-fade-up anim-d5">
            <div className="card-header">
              <h2 className="card-title">Actions rapides</h2>
            </div>
            {[
              { href: '/dashboard/artisan/products/create', icon: '◈', label: 'Ajouter un produit',  bg: '#0234AB22' },
              { href: '/dashboard/artisan/orders',          icon: '◉', label: 'Gérer les commandes', bg: '#0B9E5E22' },
              { href: '/dashboard/artisan/profile',         icon: '◎', label: 'Modifier le profil',  bg: '#8B5CF622' },
            ].map(a => (
              <Link key={a.href} href={a.href} className="quick-action-btn">
                <span className="quick-action-icon" style={{ background: a.bg }}>{a.icon}</span>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}