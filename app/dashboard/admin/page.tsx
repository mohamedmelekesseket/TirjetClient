'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useApiToken } from '@/lib/useApiToken';
import {
  Loader2, Users, Package, ShoppingCart, TrendingUp,
  Clock, CheckCircle, XCircle, AlertTriangle, BarChart2,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Artisan {
  _id: string;
  name: string;
  city?: string;
  speciality?: string;
  status: string;
  createdAt: string;
  user?: { name: string; email: string };
}

interface Product {
  _id: string;
  title: string;
  price: number;
  views: number;
  isApproved: boolean;
  isSuspended: boolean;
  isReported: boolean;
  artisan?: { name: string };
  createdAt: string;

}

interface Order {
  _id: string;
  // API returns `total`, not `totalPrice` — mirrors ArtisanDashboard Order type
  total: number;
  status: string;
  createdAt: string;
  user?: { name: string };
}

interface Stats {
  totalArtisans: number;
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  pendingArtisans: number;
  reportedProducts: number;
  suspendedProducts: number;
  revenue: number;
  pendingOrders: number;
  deliveredOrders: number;
}

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const orderStatusColor: Record<string, string> = {
  delivered: '#0B9E5E', pending: '#F59E0B', processing: '#0234AB',
  cancelled: '#E53E3E', shipped: '#8B5CF6',
};
const orderStatusLabel: Record<string, string> = {
  delivered: 'Livré', pending: 'En attente', processing: 'En cours',
  cancelled: 'Annulé', shipped: 'Expédié',
};

export default function AdminDashboard() {
  const { apiToken } = useApiToken();

  const [stats, setStats] = useState<Stats>({
    totalArtisans: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    pendingArtisans: 0,
    reportedProducts: 0,
    suspendedProducts: 0,
    revenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
  });

  const [pendingArtisans, setPendingArtisans] = useState<Artisan[]>([]);
  const [recentProducts, setRecentProducts]   = useState<Product[]>([]);
  const [recentOrders, setRecentOrders]       = useState<Order[]>([]);

  // Monthly revenue buckets: last 6 months derived from orders
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: number; year: number; amount: number }[]>([]);

  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const headers = useCallback(() => ({
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  }), [apiToken]);

  const fetchAll = useCallback(async () => {
    // Mirror ArtisanDashboard: guard at the top, same pattern
    if (!apiToken) return;
    try {
      setLoading(true);

      // Use ?limit=100 for artisans + products to get full lists for stats,
      // matching ArtisanDashboard's fetch pattern
      const [artisansRes, productsRes, usersRes, ordersRes] = await Promise.all([
        fetch(`${API}/api/artisans?limit=100`,  { headers: headers() }),
        fetch(`${API}/api/products?limit=100`,  { headers: headers() }),
        fetch(`${API}/api/users?limit=100`,     { headers: headers() }),
        fetch(`${API}/api/orders?limit=100`,    { headers: headers() }),
      ]);

      const [artisansData, productsData, usersData, ordersData] = await Promise.all([
        artisansRes.ok  ? artisansRes.json()  : null,
        productsRes.ok  ? productsRes.json()  : null,
        usersRes.ok     ? usersRes.json()     : null,
        ordersRes.ok    ? ordersRes.json()    : null,
      ]);

      const allArtisans: Artisan[] = artisansData?.artisans ?? artisansData?.data ?? [];
      const allProducts: Product[] = productsData?.products ?? productsData?.data ?? [];
      const allOrders:   Order[]   = ordersData?.orders     ?? ordersData?.data   ?? [];

      // ── Artisan stats ──────────────────────────────────────────────────────
      const pending = allArtisans.filter(a => a.status === 'pending');

      // ── Product stats ──────────────────────────────────────────────────────
      const reported   = allProducts.filter(p => p.isReported);
      const suspended  = allProducts.filter(p => p.isSuspended);

      // ── Order stats — use `total`, not `totalPrice` (mirrors ArtisanDashboard) ──
      const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
      const pendingOrders   = allOrders.filter(o => o.status === 'pending');
      const revenue         = deliveredOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

      // ── Last 6 months revenue from delivered orders ────────────────────────
      const now = new Date();
      const last6 = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return { month: d.getMonth() + 1, year: d.getFullYear(), amount: 0 };
      });
      for (const o of deliveredOrders) {
        const d = new Date(o.createdAt);
        const entry = last6.find(e => e.month === d.getMonth() + 1 && e.year === d.getFullYear());
        if (entry) entry.amount += o.total ?? 0;
      }

      setStats({
        totalArtisans:    artisansData?.total ?? allArtisans.length,
        totalProducts:    productsData?.total ?? allProducts.length,
        totalUsers:       usersData?.total    ?? 0,
        totalOrders:      ordersData?.total   ?? allOrders.length,
        pendingArtisans:  pending.length,
        reportedProducts: reported.length,
        suspendedProducts: suspended.length,
        revenue,
        pendingOrders:    pendingOrders.length,
        deliveredOrders:  deliveredOrders.length,
      });

      setMonthlyRevenue(last6);
      setPendingArtisans(pending.slice(0, 3));
      setRecentProducts(allProducts.slice(0, 5));
      setRecentOrders(allOrders.slice(0, 5));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiToken, headers]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Artisan approval actions ───────────────────────────────────────────────
  const approveArtisan = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`${API}/api/artisans/${id}/approve`, { method: 'PATCH', headers: headers() });
      setPendingArtisans(prev => prev.filter(a => a._id !== id));
      setStats(s => ({ ...s, pendingArtisans: s.pendingArtisans - 1 }));
    } finally {
      setActionLoading(null);
    }
  };

  const rejectArtisan = async (id: string) => {
    setActionLoading(id + '_reject');
    try {
      await fetch(`${API}/api/artisans/${id}/reject`, { method: 'PATCH', headers: headers() });
      setPendingArtisans(prev => prev.filter(a => a._id !== id));
      setStats(s => ({ ...s, pendingArtisans: s.pendingArtisans - 1 }));
    } finally {
      setActionLoading(null);
    }
  };

  // ── Stat cards — mirrors ArtisanDashboard statCards shape ────────────────
  const statCards = [
    {
      icon: <Users size={20} />,
      label: 'Artisans',
      value: stats.totalArtisans,
      sub: stats.pendingArtisans > 0
        ? `${stats.pendingArtisans} en attente d'approbation`
        : 'Tous approuvés',
      color: '#0234AB',
      href: '/dashboard/admin/artisans',
    },
    {
      icon: <Package size={20} />,
      label: 'Produits',
      value: stats.totalProducts,
      sub: stats.reportedProducts > 0
        ? `${stats.reportedProducts} signalés · ${stats.suspendedProducts} suspendus`
        : `${stats.suspendedProducts} suspendus`,
      color: '#0B9E5E',
      href: '/dashboard/admin/products',
    },
    {
      icon: <Users size={20} />,
      label: 'Utilisateurs',
      value: stats.totalUsers,
      sub: 'Comptes enregistrés',
      color: '#8B5CF6',
      href: '/dashboard/admin/users',
    },
    {
      icon: <ShoppingCart size={20} />,
      label: 'Commandes',
      value: stats.totalOrders,
      sub: `${stats.deliveredOrders} livrées · ${stats.pendingOrders} en attente`,
      color: '#F5A623',
      href: '/dashboard/admin/orders',
    },
    {
      icon: <TrendingUp size={20} />,
      label: 'Revenus (livrés)',
      value: `${stats.revenue.toLocaleString()} TND`,
      sub: `Ce mois : ${(monthlyRevenue.at(-1)?.amount ?? 0).toLocaleString()} TND`,
      color: '#EF4444',
      href: null,
    },
  ];

  // ── Mini bar chart ────────────────────────────────────────────────────────
  const maxAmount = Math.max(...monthlyRevenue.map(r => r.amount), 1);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5rem', gap: 12 }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#0234AB' }} />
      <span style={{ color: '#8B9AB5' }}>Chargement du tableau de bord…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div className="page-header anim-fade-up">
        <div>
          <div className="page-greeting">Bienvenue, Administrateur ✦</div>
          <h1 className="page-title">Tableau de bord Admin</h1>
          <p className="page-subtitle">Supervision et contrôle de la plateforme Artisana</p>
        </div>
        <div className="header-actions-row">
          <Link href="/dashboard/admin/artisans" className="btn btn-secondary">◈ Artisans</Link>
          <Link href="/dashboard/admin/products"  className="btn btn-primary">◉ Produits</Link>
        </div>
      </div>

      {/* Alerts — mirrors ArtisanDashboard alert block ─────────────────── */}
      {(stats.pendingArtisans > 0 || stats.reportedProducts > 0 || stats.suspendedProducts > 0) && (
        <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {stats.pendingArtisans > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, fontSize: '0.83rem', color: '#92400e' }}>
              <Clock size={15} />
              <strong>{stats.pendingArtisans}</strong> artisan(s) en attente d'approbation
              <Link href="/dashboard/admin/artisans" style={{ color: '#0234AB', fontWeight: 600, marginLeft: 4 }}>Voir →</Link>
            </div>
          )}
          {stats.reportedProducts > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 10, fontSize: '0.83rem', color: '#c53030' }}>
              <AlertTriangle size={15} />
              <strong>{stats.reportedProducts}</strong> produit(s) signalé(s)
              <Link href="/dashboard/admin/products" style={{ color: '#0234AB', fontWeight: 600, marginLeft: 4 }}>Voir →</Link>
            </div>
          )}
          {stats.suspendedProducts > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 10, fontSize: '0.83rem', color: '#c53030' }}>
              <AlertTriangle size={15} />
              <strong>{stats.suspendedProducts}</strong> produit(s) suspendu(s)
              <Link href="/dashboard/admin/products" style={{ color: '#0234AB', fontWeight: 600, marginLeft: 4 }}>Voir →</Link>
            </div>
          )}
        </div>
      )}

      {/* Stats grid — same card shape as ArtisanDashboard ──────────────── */}
      <div className="admin-stats-grid">
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

      {/* Revenue chart — mirrors ArtisanDashboard mini bar chart ────────── */}
      <div className="card anim-fade-up" style={{ padding: '20px 22px', marginBottom: '1.5rem' }}>
        <div className="card-header" style={{ marginBottom: 16 }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={16} style={{ color: '#EF4444' }} /> Revenus — 6 derniers mois
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100 }}>
          {monthlyRevenue.map((r, i) => {
            const now = new Date();
            const isCurrent = r.month === now.getMonth() + 1 && r.year === now.getFullYear();
            const heightPct = Math.round((r.amount / maxAmount) * 100);
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: '0.65rem', color: '#8B9AB5', fontWeight: 600 }}>
                  {r.amount > 0 ? r.amount.toLocaleString() : '—'}
                </div>
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: 60 }}>
                  <div style={{
                    width: '100%',
                    height: `${Math.max(heightPct, 4)}%`,
                    background: isCurrent ? '#EF4444' : '#0234AB22',
                    borderRadius: 6,
                    transition: 'height 0.4s ease',
                  }} />
                </div>
                <div style={{ fontSize: '0.65rem', color: isCurrent ? '#EF4444' : '#8B9AB5', fontWeight: isCurrent ? 700 : 400 }}>
                  {MONTH_NAMES[r.month - 1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-col grid ───────────────────────────────────────────────────── */}
      <div className="admin-grid">

        {/* Pending artisans */}
        <div className="card anim-fade-up anim-d3">
          <div className="card-header">
            <div>
              <h2 className="card-title">Artisans en attente</h2>
              <div className="card-subtitle">
                {pendingArtisans.length === 0
                  ? 'Aucune demande en attente'
                  : `${pendingArtisans.length} demande(s) à valider`}
              </div>
            </div>
            {pendingArtisans.length > 0 && <span className="badge badge-warning">⚑ Urgent</span>}
          </div>
          <div style={{ padding: '8px 0' }}>
            {pendingArtisans.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#8B9AB5', fontSize: '0.85rem' }}>
                <CheckCircle size={32} style={{ margin: '0 auto 8px', color: '#0B9E5E', display: 'block' }} />
                Tout est à jour !
              </div>
            ) : pendingArtisans.map((a, i) => (
              <div key={a._id} className="order-item" style={{ animationDelay: `${i * 0.08}s` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg, #0234AB, #1a4fd4)', color: 'white', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {(a.user?.name ?? a.name ?? '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.user?.name ?? a.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8B9AB5', marginTop: 2 }}>
                      {a.city ?? '—'} · {a.speciality ?? 'Artisan'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#8B9AB5' }}>
                      {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => approveArtisan(a._id)}
                    disabled={actionLoading === a._id}
                    title="Approuver"
                  >
                    {actionLoading === a._id
                      ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                      : <CheckCircle size={14} />}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => rejectArtisan(a._id)}
                    disabled={actionLoading === a._id + '_reject'}
                    title="Rejeter"
                  >
                    {actionLoading === a._id + '_reject'
                      ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                      : <XCircle size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 22px', borderTop: '1px solid rgba(2,52,171,0.06)' }}>
            <Link href="/dashboard/admin/artisans" className="see-all">Voir toutes les demandes →</Link>
          </div>
        </div>

        {/* Recent orders */}
        <div className="card anim-fade-up anim-d4">
          <div className="card-header">
            <h2 className="card-title">Commandes récentes</h2>
            <Link href="/dashboard/admin/orders" className="see-all">Voir tout →</Link>
          </div>
          <div style={{ padding: '8px 0' }}>
            {recentOrders.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#8B9AB5', fontSize: '0.85rem' }}>
                Aucune commande
              </div>
            ) : recentOrders.map((o) => (
              <div key={o._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 22px', borderBottom: '1px solid rgba(2,52,171,0.05)' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0A0F2C' }}>
                    #{o._id.slice(-6).toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#8B9AB5', marginTop: 2 }}>
                    {o.user?.name ?? 'Client'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {/* FIX: was o.totalPrice — correct field is o.total */}
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0A0F2C' }}>
                    {(o.total ?? 0).toLocaleString()} TND
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: `${orderStatusColor[o.status] ?? '#8B9AB5'}18`, color: orderStatusColor[o.status] ?? '#8B9AB5' }}>
                    {orderStatusLabel[o.status] ?? o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent products table */}
      <div className="card anim-fade-up anim-d4" style={{ marginTop: 0,marginBottom:"5%" }}>
        <div className="card-header">
          <h2 className="card-title">Produits récents</h2>
          <Link href="/dashboard/admin/products" className="see-all">Voir tout →</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Artisan</th>
                <th>Prix</th>
                <th>Statut</th>
                <th>views</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.map((p) => (
                <tr key={p._id}>
                  <td>
                    <Link href={`/dashboard/admin/products/${p._id}`} style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0234AB', textDecoration: 'none' }}>
                      {p.title}
                    </Link>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#8B9AB5' }}>{p.artisan?.name ?? '—'}</td>
                  <td style={{ fontWeight: 700, fontSize: '0.8rem' }}>{p.price} TND</td>
                  <td>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: p.isSuspended ? '#fff5f5' : p.isApproved ? '#f0fff4' : '#fffbeb', color: p.isSuspended ? '#e53e3e' : p.isApproved ? '#0B9E5E' : '#F59E0B' }}>
                      {p.isSuspended ? 'Suspendu' : p.isApproved ? 'Approuvé' : 'En attente'}
                    </span>
                  </td>
                  <td>
                    {p.views}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick nav — mirrors ArtisanDashboard quick actions ─────────────── */}
      <div className="admin-quick-nav anim-fade-up anim-d5">
        {[
          { href: '/dashboard/admin/artisans', icon: '◈', label: 'Gérer artisans',     sub: `${stats.totalArtisans} artisans`,    color: '#0234AB' },
          { href: '/dashboard/admin/products', icon: '◉', label: 'Gérer produits',     sub: `${stats.totalProducts} produits`,    color: '#0B9E5E' },
          { href: '/dashboard/admin/users',    icon: '◎', label: 'Gérer utilisateurs', sub: `${stats.totalUsers} comptes`,        color: '#8B5CF6' },
          { href: '/dashboard/admin/orders',   icon: '◇', label: 'Commandes',          sub: `${stats.totalOrders} commandes`,     color: '#F5A623' },
        ].map((item, i) => (
          <Link key={item.href} href={item.href} className="card"
            style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, animationDelay: `${0.3 + i * 0.07}s`, textDecoration: 'none' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', color: item.color }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#0A0F2C', fontSize: '0.9rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.78rem', color: '#8B9AB5', marginTop: 3 }}>{item.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}