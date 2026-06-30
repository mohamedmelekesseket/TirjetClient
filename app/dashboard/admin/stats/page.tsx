'use client';
import { useEffect, useState, useCallback } from 'react';
import { useApiToken } from '@/lib/useApiToken';
import { Loader2, TrendingUp, ShoppingCart, Users, Eye } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Order {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
  user?: { _id: string };
}

interface Product {
  _id: string;
  category?: { _id: string; name: string } | string;
  artisan?: { _id: string; name: string };
}

interface Artisan {
  _id: string;
  name: string;
  status: string;
  createdAt: string;
}

// ── Derived shape used in render ───────────────────────────────────────────────
interface MonthlyEntry {
  month: string;   // 'Jan', 'Fév', …
  monthNum: number;
  year: number;
  orders: number;
  revenue: number;
  artisans: number; // cumulative approved artisans at that month
}

interface TopArtisan {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  pct: number;
}

interface CategoryStat {
  name: string;
  count: number;
  pct: number;
  color: string;
}

interface KPI {
  totalRevenue: number;
  totalOrders: number;
  activeArtisans: number;
  uniqueClients: number;
  revenueGrowth: number;  // % vs prior month
  ordersGrowth: number;
  artisanGrowth: number;
}

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const CAT_COLORS  = ['#0234AB', '#1a4fd4', '#0B9E5E', '#F5A623', '#8B5CF6', '#EF4444', '#8B9AB5', '#F59E0B'];

// ── Component ──────────────────────────────────────────────────────────────────
export default function AdminStatsPage() {
  const { apiToken } = useApiToken();

  const [loading, setLoading]         = useState(true);
  const [kpi, setKpi]                 = useState<KPI | null>(null);
  const [monthly, setMonthly]         = useState<MonthlyEntry[]>([]);
  const [topArtisans, setTopArtisans] = useState<TopArtisan[]>([]);
  const [categories, setCategories]   = useState<CategoryStat[]>([]);
  const [range, setRange]             = useState<'7m' | '30d' | 'year'>('7m');

  const headers = useCallback(() => ({
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  }), [apiToken]);

  const fetchAll = useCallback(async () => {
    if (!apiToken) return;
    try {
      setLoading(true);

      const [ordersRes, productsRes, artisansRes, usersRes] = await Promise.all([
        fetch(`${API}/api/orders?limit=1000`,   { headers: headers() }),
        fetch(`${API}/api/products?limit=1000`, { headers: headers() }),
        fetch(`${API}/api/artisans?limit=1000`, { headers: headers() }),
        fetch(`${API}/api/users?limit=1000`,    { headers: headers() }),
      ]);

      const [ordersData, productsData, artisansData, usersData] = await Promise.all([
        ordersRes.ok    ? ordersRes.json()    : null,
        productsRes.ok  ? productsRes.json()  : null,
        artisansRes.ok  ? artisansRes.json()  : null,
        usersRes.ok     ? usersRes.json()     : null,
      ]);

      const allOrders:   Order[]   = ordersData?.orders     ?? ordersData?.data   ?? [];
      const allProducts: Product[] = productsData?.products ?? productsData?.data ?? [];
      const allArtisans: Artisan[] = artisansData?.artisans ?? artisansData?.data ?? [];

      // ── KPIs ─────────────────────────────────────────────────────────────────
      const delivered      = allOrders.filter(o => o.status === 'delivered');
      const totalRevenue   = delivered.reduce((s, o) => s + (o.total ?? 0), 0);
      const totalOrders    = allOrders.length;
      const activeArtisans = allArtisans.filter(a => a.status === 'approved').length;
      const uniqueClients  = new Set(allOrders.map(o => o.user?._id).filter(Boolean)).size;

      // Growth vs prior calendar month
      const now      = new Date();
      const curM = now.getMonth() + 1;
      const curY = now.getFullYear();
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevM    = prevDate.getMonth() + 1;
      const prevY    = prevDate.getFullYear();

      const inMonth = (o: Order, m: number, y: number) => {
        const d = new Date(o.createdAt);
        return d.getMonth() + 1 === m && d.getFullYear() === y;
      };

      const curRevenue  = delivered.filter(o => inMonth(o, curM, curY)).reduce((s, o) => s + (o.total ?? 0), 0);
      const prevRevenue = delivered.filter(o => inMonth(o, prevM, prevY)).reduce((s, o) => s + (o.total ?? 0), 0);
      const curOrd      = allOrders.filter(o => inMonth(o, curM, curY)).length;
      const prevOrd     = allOrders.filter(o => inMonth(o, prevM, prevY)).length;

      const growthPct = (cur: number, prev: number) =>
        prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100);

      const curArtisans  = allArtisans.filter(a => {
        const d = new Date(a.createdAt);
        return d.getMonth() + 1 === curM && d.getFullYear() === curY && a.status === 'approved';
      }).length;
      const prevArtisans = allArtisans.filter(a => {
        const d = new Date(a.createdAt);
        return d.getMonth() + 1 === prevM && d.getFullYear() === prevY && a.status === 'approved';
      }).length;

      setKpi({
        totalRevenue,
        totalOrders,
        activeArtisans,
        uniqueClients: usersData?.total ?? uniqueClients,
        revenueGrowth: growthPct(curRevenue, prevRevenue),
        ordersGrowth:  growthPct(curOrd, prevOrd),
        artisanGrowth: curArtisans - prevArtisans,
      });

      // ── Monthly entries (last 7 months) ──────────────────────────────────────
      const months7: MonthlyEntry[] = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();

        const monthOrders    = allOrders.filter(o => inMonth(o, m, y));
        const monthDelivered = monthOrders.filter(o => o.status === 'delivered');
        const monthRevenue   = monthDelivered.reduce((s, o) => s + (o.total ?? 0), 0);

        // Artisans approved up to end of this month
        const endOfMonth = new Date(y, m, 0);
        const artisanCount = allArtisans.filter(a => a.status === 'approved' && new Date(a.createdAt) <= endOfMonth).length;

        return {
          month: MONTH_NAMES[m - 1],
          monthNum: m,
          year: y,
          orders:   monthOrders.length,
          revenue:  monthRevenue,
          artisans: artisanCount,
        };
      });
      setMonthly(months7);

      // ── Top artisans by revenue ───────────────────────────────────────────────
      const artisanRevMap: Record<string, { name: string; revenue: number; orders: number }> = {};
      for (const o of delivered) {
        // orders don't carry artisan directly; we approximate from products map
        // use artisan id from product if available — fallback to order-level if API provides it
        const key = (o as any).artisan?._id ?? (o as any).artisanId ?? 'unknown';
        const name = (o as any).artisan?.name ?? (o as any).artisanName ?? key;
        if (key === 'unknown') continue;
        if (!artisanRevMap[key]) artisanRevMap[key] = { name, revenue: 0, orders: 0 };
        artisanRevMap[key].revenue += o.total ?? 0;
        artisanRevMap[key].orders  += 1;
      }

      // Fallback: if artisan info on orders not present, build from artisans list
      let topList: TopArtisan[] = Object.entries(artisanRevMap)
        .map(([id, v]) => ({ id, ...v, pct: 0 }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // If we got nothing from orders, show artisans sorted by order count (stub)
      if (topList.length === 0) {
        topList = allArtisans
          .filter(a => a.status === 'approved')
          .slice(0, 5)
          .map((a, i) => ({ id: a._id, name: a.name, revenue: 0, orders: 0, pct: 0 }));
      }

      const maxRev = Math.max(...topList.map(t => t.revenue), 1);
      topList = topList.map(t => ({ ...t, pct: Math.round((t.revenue / maxRev) * 100) }));
      setTopArtisans(topList);

      // ── Categories ───────────────────────────────────────────────────────────
      const catMap: Record<string, number> = {};
      for (const p of allProducts) {
        const name = !p.category
          ? 'Autre'
          : typeof p.category === 'string'
            ? p.category
            : p.category.name ?? 'Autre';
        catMap[name] = (catMap[name] ?? 0) + 1;
      }
      const total = allProducts.length || 1;
      const catStats: CategoryStat[] = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count], i) => ({
          name,
          count,
          pct: Math.round((count / total) * 100),
          color: CAT_COLORS[i] ?? '#8B9AB5',
        }));
      setCategories(catStats);

    } catch (err) {
      console.error('Stats page fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiToken, headers]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived chart values ───────────────────────────────────────────────────
  const maxOrders  = Math.max(...monthly.map(d => d.orders),  1);
  const maxRevenue = Math.max(...monthly.map(d => d.revenue), 1);

  const fmtGrowth = (n: number, suffix = '%') =>
    n === 0 ? '—' : `${n > 0 ? '+' : ''}${n}${suffix}`;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5rem', gap: 12 }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#0234AB' }} />
      <span style={{ color: '#8B9AB5' }}>Chargement des statistiques…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Statistiques</h1>
          <p className="page-subtitle">Analyse complète des performances de la plateforme</p>
        </div>
        <div className="header-actions-row">
          <select
            className="form-select"
            style={{ width: 'auto', padding: '9px 36px 9px 14px' }}
            value={range}
            onChange={e => setRange(e.target.value as typeof range)}
          >
            <option value="7m">7 derniers mois</option>
            <option value="30d">30 derniers jours</option>
            <option value="year">Cette année</option>
          </select>
          <button className="btn btn-secondary">⬇ Rapport PDF</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="dash-kpi-4" style={{ marginBottom: '28px' }}>
        {[
          {
            label: 'Revenu total',
            val: `${(kpi?.totalRevenue ?? 0).toLocaleString('fr-FR')} TND`,
            delta: fmtGrowth(kpi?.revenueGrowth ?? 0),
            color: '#F5A623',
            icon: <TrendingUp size={16} />,
          },
          {
            label: 'Commandes',
            val: (kpi?.totalOrders ?? 0).toLocaleString('fr-FR'),
            delta: fmtGrowth(kpi?.ordersGrowth ?? 0),
            color: '#0234AB',
            icon: <ShoppingCart size={16} />,
          },
          {
            label: 'Artisans actifs',
            val: (kpi?.activeArtisans ?? 0).toLocaleString('fr-FR'),
            delta: fmtGrowth(kpi?.artisanGrowth ?? 0, ''),
            color: '#0B9E5E',
            icon: <Users size={16} />,
          },
          {
            label: 'Clients uniques',
            val: (kpi?.uniqueClients ?? 0).toLocaleString('fr-FR'),
            delta: '—',
            color: '#8B5CF6',
            icon: <Eye size={16} />,
          },
        ].map((k, i) => (
          <div key={k.label} className="stat-card anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="stat-card-top">
              <div className="stat-card-label" style={{ alignSelf: 'flex-start',color:"white", marginBottom: 0 }}>
                {k.label}
              </div>
              {k.delta !== '—' && (
                <span className={`stat-card-delta ${(kpi as any)?.[`${['revenue','orders','artisan'][i]}Growth`] >= 0 ? 'pos' : 'neg'}`}>
                  {k.delta}
                </span>
              )}
            </div>
            <div className="stat-card-value" style={{ color: k.color, fontSize: '1.5rem', marginTop: '8px' }}>
              {k.val}
            </div>
            <div className="stat-card-bar" style={{ background: `linear-gradient(90deg, ${k.color}, ${k.color}88)` }} />
          </div>
        ))}
      </div>

      <div className="dash-two-col" style={{ marginBottom: '24px' }}>

        {/* Bar chart — Commandes par mois */}
        <div className="card anim-fade-up anim-d2" style={{background:"#232C47"}}>
          <div className="card-header">
            <h2 className="card-title" style={{color:"white"}}>Commandes par mois</h2>
            <span className="badge badge-primary">
              {monthly[0]?.month} {monthly[0]?.year} — {monthly.at(-1)?.month} {monthly.at(-1)?.year}
            </span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '180px', padding: '0 8px' }}>
              {monthly.map((d, i) => {
                const h = Math.round((d.orders / maxOrders) * 140);
                const isLast = i === monthly.length - 1;
                return (
                  <div key={`${d.month}-${d.year}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '0.65rem', color: isLast ? '#F5A623' : '#0234AB',
                      fontWeight: 700,
                      opacity: 0,
                      animation: `fadeIn 0.4s ease both ${0.3 + i * 0.07}s`,
                      animationFillMode: 'both',
                    }}>
                      {d.orders > 0 ? d.orders : '—'}
                    </span>
                    <div style={{
                      width: '100%',
                      height: `${Math.max(h, 4)}px`,
                      borderRadius: '6px 6px 0 0',
                      background: isLast
                        ? 'linear-gradient(180deg, #F5A623, #E8891A)'
                        : 'linear-gradient(180deg, #0234AB, #1a4fd4)',
                      animation: `fadeInUp 0.6s cubic-bezier(0.4,0,0.2,1) both ${0.2 + i * 0.07}s`,
                      boxShadow: isLast
                        ? '0 4px 16px rgba(245,166,35,0.4)'
                        : '0 4px 12px rgba(2,52,171,0.2)',
                      transition: 'all 0.3s ease',
                      cursor: 'default',
                    }} />
                    <span style={{ fontSize: '0.68rem', color: '#8B9AB5', fontWeight: 600 }}>{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Revenue horizontal bars */}
        <div className="card anim-fade-up anim-d3" style={{background:"#232C47"}}>
          <div className="card-header">
            <h2 className="card-title" style={{color:"white"}}>Revenus mensuels (TND)</h2>
            {(kpi?.revenueGrowth ?? 0) !== 0 && (
              <span className={`badge ${(kpi?.revenueGrowth ?? 0) >= 0 ? 'badge-success' : 'badge-danger'}`}>
                {fmtGrowth(kpi?.revenueGrowth ?? 0)} ce mois
              </span>
            )}
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '16px' }}>
              {monthly.map((d, i) => {
                const pct = Math.round((d.revenue / maxRevenue) * 100);
                const isLast = i === monthly.length - 1;
                return (
                  <div key={`rev-${d.month}-${d.year}`} style={{ marginBottom: '10px', animation: `fadeInLeft 0.5s ease both ${0.1 + i * 0.07}s` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ffffff' }}>{d.month}</span>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', fontWeight: 700, color: '  #0c4ee7' }}>
                        {d.revenue > 0 ? d.revenue.toLocaleString('fr-FR') : '—'} TND
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.max(pct, d.revenue > 0 ? 2 : 0)}%`,
                          background: isLast
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
        </div>
      </div>

      <div className="dash-two-col">

        {/* Top artisans */}
        <div className="card anim-fade-up anim-d4">
          <div className="card-header">
            <h2 className="card-title">Top Artisans</h2>
            <span className="badge badge-warning">Par revenu</span>
          </div>
          <div className="card-body">
            {topArtisans.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#8B9AB5', fontSize: '0.85rem' }}>
                Aucune donnée disponible
              </div>
            ) : topArtisans.map((a, i) => (
              <div key={a.id} style={{ marginBottom: '18px', animation: `fadeInUp 0.5s ease both ${0.1 + i * 0.08}s` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '22px', height: '22px', borderRadius: '6px',
                      background: i === 0 ? '#F5A623' : i === 1 ? '#8B9AB5' : i === 2 ? '#CD853F' : '#EEF2FF',
                      color: i < 3 ? 'white' : '#8B9AB5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0A0F2C' }}>{a.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', fontWeight: 700, color: '#0B9E5E' }}>
                      {a.revenue > 0 ? `${a.revenue.toLocaleString('fr-FR')} TND` : '—'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#8B9AB5' }}>{a.orders} cmds</div>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${a.pct}%`,
                      animationDelay: `${0.3 + i * 0.08}s`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories donut */}
        <div className="card anim-fade-up anim-d5">
          <div className="card-header">
            <h2 className="card-title">Répartition par catégorie</h2>
            <span className="badge badge-primary">Produits</span>
          </div>
          <div className="card-body">
            {categories.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#8B9AB5', fontSize: '0.85rem' }}>
                Aucune catégorie disponible
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
                {/* SVG donut */}
                <div style={{ flexShrink: 0 }}>
                  <svg width="140" height="140" viewBox="0 0 140 140">
                    {(() => {
                      let offset = 0;
                      const r    = 52;
                      const circ = 2 * Math.PI * r;
                      // Normalise percentages to always sum to 100
                      const totalPct = categories.reduce((s, c) => s + c.pct, 0) || 1;
                      return categories.map((c, i) => {
                        const normPct = (c.pct / totalPct) * 100;
                        const dash    = (normPct / 100) * circ;
                        const gap     = circ - dash;
                        const rotate  = (offset / 100) * 360 - 90;
                        offset += normPct;
                        return (
                          <circle
                            key={c.name}
                            cx="70" cy="70" r={r}
                            fill="none"
                            stroke={c.color}
                            strokeWidth="20"
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset="0"
                            transform={`rotate(${rotate} 70 70)`}
                            style={{ animation: `fadeIn 0.8s ease both ${i * 0.1}s`, opacity: 0.9 }}
                          />
                        );
                      });
                    })()}
                    <text x="70" y="65" textAnchor="middle" style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 700, fill: '#0A0F2C' }}>
                      {categories.length}
                    </text>
                    <text x="70" y="82" textAnchor="middle" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fill: '#8B9AB5' }}>
                      catégories
                    </text>
                  </svg>
                </div>

                {/* Legend */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {categories.map((c, i) => (
                    <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: `fadeInRight 0.4s ease both ${0.1 + i * 0.07}s` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: c.color, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.82rem', color: '#4A5568' }}>{c.name}</span>
                      </div>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', fontWeight: 700, color: c.color }}>
                        {c.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}