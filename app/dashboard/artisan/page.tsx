'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Loader2, Package, ShoppingCart, TrendingUp,
  Eye, Plus, AlertTriangle, BarChart2,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Product {
  _id: string;
  title: string;
  price: number;
  stock: number;
  views: number;
  isApproved: boolean;
  isSuspended: boolean;
  category?: { name: string } | string;
  images?: string[];
  createdAt: string;
}

interface Order {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
  user?: { name: string };
  items?: { product: { title: string } }[];
}

interface RevenueEntry {
  month: number;
  year: number;
  amount: number;
}

interface ArtisanProfile {
  revenus?: RevenueEntry[];
}

interface Stats {
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  suspendedProducts: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  currentMonthRevenue: number;
  totalViews: number;
}

export default function ArtisanDashboard() {
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;
  const userName = (session as any)?.user?.name ?? 'Artisan';

  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    suspendedProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
    currentMonthRevenue: 0,
    totalViews: 0,
  });

  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders]     = useState<Order[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<RevenueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = useCallback(() => ({
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  }), [apiToken]);

  const fetchAll = useCallback(async () => {
    if (!apiToken) return;
    try {
      setLoading(true);

      const [productsRes, ordersRes, profileRes] = await Promise.all([
        fetch(`${API}/api/products/mine?limit=100`, { headers: headers() }),
        fetch(`${API}/api/orders/artisan?limit=100`, { headers: headers() }),
        fetch(`${API}/api/artisans/me`, { headers: headers() }),
      ]);

      const [productsData, ordersData, profileData] = await Promise.all([
        productsRes.ok ? productsRes.json() : null,
        ordersRes.ok   ? ordersRes.json()   : null,
        profileRes.ok  ? profileRes.json()  : null,
      ]);

      const products: Product[]     = productsData?.products ?? [];
      const orders: Order[]         = ordersData?.orders     ?? [];

      const approvedProducts  = products.filter(p => p.isApproved && !p.isSuspended).length;
      const pendingProducts   = products.filter(p => !p.isApproved && !p.isSuspended).length;
      const suspendedProducts = products.filter(p => p.isSuspended).length;
      const totalViews        = products.reduce((sum, p) => sum + (p.views ?? 0), 0);

      const deliveredOrders = orders.filter(o => o.status === 'delivered');
      const pendingOrders   = orders.filter(o => o.status === 'pending').length;
      const totalRevenue    = deliveredOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

      // ── Last 6 months bucketed from delivered orders (same source as totalRevenue) ──
      const now = new Date();
      const last6: RevenueEntry[] = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return { month: d.getMonth() + 1, year: d.getFullYear(), amount: 0 };
      });
      for (const o of deliveredOrders) {
        const d = new Date(o.createdAt);
        const entry = last6.find(
          e => e.month === d.getMonth() + 1 && e.year === d.getFullYear()
        );
        if (entry) entry.amount += o.total ?? 0;
      }

      // Current-month revenue from bucketed orders; fallback to profile.revenus if available
      const profile: ArtisanProfile = profileData ?? {};
      const revenus: RevenueEntry[] = profile.revenus ?? [];
      const curM = now.getMonth() + 1;
      const curY = now.getFullYear();
      const currentMonthRevenue =
        last6.find(e => e.month === curM && e.year === curY)?.amount
        ?? revenus.find(r => r.month === curM && r.year === curY)?.amount
        ?? 0;

      setStats({
        totalProducts:      productsData?.total ?? products.length,
        approvedProducts,
        pendingProducts,
        suspendedProducts,
        totalOrders:        ordersData?.total   ?? orders.length,
        pendingOrders,
        deliveredOrders:    deliveredOrders.length,
        totalRevenue,
        currentMonthRevenue,
        totalViews,
      });

      setRecentProducts(products.slice(0, 5));
      setRecentOrders(orders.slice(0, 5));
      setMonthlyRevenue(last6);
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

  const MONTH_NAMES = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];

  const orderStatusColor: Record<string, string> = {
    delivered: '#0B9E5E', pending: '#F59E0B', processing: '#0234AB',
    cancelled: '#E53E3E', shipped: '#8B5CF6',
  };
  const orderStatusLabel: Record<string, string> = {
    delivered: 'Livré', pending: 'En attente', processing: 'En cours',
    cancelled: 'Annulé', shipped: 'Expédié',
  };

  const statCards = [
    {
      icon: <Package size={20} />,
      label: 'Produits',
      value: stats.totalProducts,
      sub: `${stats.approvedProducts} actifs · ${stats.pendingProducts} en attente`,
      color: '#0234AB',
      href: '/dashboard/artisan/products',
    },
    {
      icon: <ShoppingCart size={20} />,
      label: 'Commandes',
      value: stats.totalOrders,
      sub: `${stats.deliveredOrders} livrées · ${stats.pendingOrders} en attente`,
      color: '#0B9E5E',
      href: '/dashboard/artisan/orders',
    },
    {
      icon: <TrendingUp size={20} />,
      label: 'Revenu total',
      value: `${stats.totalRevenue.toLocaleString()} TND`,
      sub: `Ce mois : ${stats.currentMonthRevenue.toLocaleString()} TND`,
      color: '#F5A623',
      href: null,
    },
    {
      icon: <Eye size={20} />,
      label: 'Vues produits',
      value: stats.totalViews.toLocaleString(),
      sub: 'Total cumulé',
      color: '#8B5CF6',
      href: null,
    },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5rem', gap: 12 }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#0234AB' }} />
      <span style={{ color: '#8B9AB5' }}>Chargement…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const maxAmount = Math.max(...monthlyRevenue.map(r => r.amount), 1);
  const now = new Date();

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progressGrow {
          from { width: 0%; }
        }
        .rev-progress-bar {
          height: 6px;
          background: rgba(2, 52, 171, 0.08);
          border-radius: 99px;
          overflow: hidden;
        }
        .rev-progress-fill {
          height: 100%;
          border-radius: 99px;
          animation: progressGrow 0.7s cubic-bezier(0.4,0,0.2,1) both;
        }
      `}</style>

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

      {/* Stat cards */}
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="card anim-fade-up" style={{ animationDelay: `${i * 0.06}s`, padding: '20px 22px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}18`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              {s.icon}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0A0F2C', letterSpacing: '-0.5px' }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#8B9AB5', marginTop: 2 }}>{s.label}</div>
            <div style={{ fontSize: '0.72rem', color: '#a0aec0', marginTop: 4 }}>{s.sub}</div>
            {s.href && (
              <Link href={s.href} style={{ fontSize: '0.75rem', color: s.color, marginTop: 8, display: 'inline-block', fontWeight: 600 }}>
                Gérer →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* ── Revenue chart — horizontal progress-bar style (from stats page) ── */}
      <div className="card anim-fade-up" style={{ padding: '20px 22px', marginBottom: '1.5rem' }}>
        <div className="card-header" style={{ marginBottom: 16 }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={16} style={{ color: '#F5A623' }} /> Revenus mensuels (TND)
          </h2>
          {stats.currentMonthRevenue > 0 && (
            <span className="badge badge-success">
              Ce mois : {stats.currentMonthRevenue.toLocaleString()} TND
            </span>
          )}
        </div>

        <div>
          {monthlyRevenue.map((r, i) => {
            const isCurrent = r.month === now.getMonth() + 1 && r.year === now.getFullYear();
            const pct = Math.round((r.amount / maxAmount) * 100);
            return (
              <div
                key={`${r.month}-${r.year}`}
                style={{
                  marginBottom: i < monthlyRevenue.length - 1 ? '12px' : 0,
                  animation: `fadeInLeft 0.5s ease both ${0.1 + i * 0.07}s`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: isCurrent ? 700 : 600,
                    color: isCurrent ? '#F5A623' : '#4A5568',
                  }}>
                    {MONTH_NAMES[r.month - 1]}
                    {isCurrent && (
                      <span style={{ marginLeft: 6, fontSize: '0.65rem', fontWeight: 600, color: '#F5A623', opacity: 0.8 }}>
                        ← en cours
                      </span>
                    )}
                  </span>
                  <span style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: isCurrent ? '#F5A623' : '#0234AB',
                  }}>
                    {r.amount > 0 ? r.amount.toLocaleString('fr-FR') : '—'} TND
                  </span>
                </div>
                <div className="rev-progress-bar">
                  <div
                    className="rev-progress-fill"
                    style={{
                      width: `${Math.max(pct, r.amount > 0 ? 2 : 0)}%`,
                      background: isCurrent
                        ? 'linear-gradient(90deg, #F5A623, #E8891A)'
                        : 'linear-gradient(90deg, #0234AB, #1a4fd4)',
                      animationDelay: `${0.2 + i * 0.07}s`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
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
                    <th>Vues</th>
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
                      <td style={{ fontSize: '0.8rem', color: '#8B9AB5' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={12} />{p.views ?? 0}
                        </span>
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
                  <div className="order-amount">{(o.total ?? 0).toLocaleString()} TND</div>
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