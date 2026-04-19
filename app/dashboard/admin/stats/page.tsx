const monthlyData = [
  { month: 'Oct', orders: 82,  revenue: 28400, artisans: 118 },
  { month: 'Nov', orders: 95,  revenue: 33200, artisans: 124 },
  { month: 'Déc', orders: 134, revenue: 48100, artisans: 128 },
  { month: 'Jan', orders: 110, revenue: 39600, artisans: 131 },
  { month: 'Fév', orders: 118, revenue: 42300, artisans: 135 },
  { month: 'Mar', orders: 142, revenue: 51800, artisans: 139 },
  { month: 'Avr', orders: 156, revenue: 57200, artisans: 142 },
];

const maxOrders = Math.max(...monthlyData.map(d => d.orders));
const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

const topArtisans = [
  { name: 'Leila Bouhsini', revenue: 62100, orders: 204, pct: 95 },
  { name: 'Nadia Rachidi',  revenue: 41400, orders: 138, pct: 63 },
  { name: 'Ahmed Benali',   revenue: 45200, orders: 156, pct: 69 },
  { name: 'Fatima Zahra',   revenue: 28400, orders: 89,  pct: 43 },
  { name: 'Omar Idrissi',   revenue: 13200, orders: 44,  pct: 20 },
];

const categories = [
  { name: 'Poterie',      pct: 28, color: '#0234AB' },
  { name: 'Maroquinerie', pct: 22, color: '#1a4fd4' },
  { name: 'Textile',      pct: 18, color: '#0B9E5E' },
  { name: 'Bijoux',       pct: 14, color: '#F5A623' },
  { name: 'Métal',        pct: 10, color: '#8B5CF6' },
  { name: 'Autres',       pct: 8,  color: '#8B9AB5' },
];

export default function AdminStatsPage() {
  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Statistiques</h1>
          <p className="page-subtitle">Analyse complète des performances de la plateforme</p>
        </div>
        <div className="header-actions-row">
          <select className="form-select" style={{ width: 'auto', padding: '9px 36px 9px 14px' }}>
            <option>7 derniers mois</option>
            <option>30 derniers jours</option>
            <option>Cette année</option>
          </select>
          <button className="btn btn-secondary">⬇ Rapport PDF</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="dash-kpi-4" style={{ marginBottom: '28px' }}>
        {[
          { label: 'Revenu total',    val: '284 200 MAD', delta: '+12%',  color: '#F5A623' },
          { label: 'Commandes',       val: '837',         delta: '+18%',  color: '#0234AB' },
          { label: 'Artisans actifs', val: '142',         delta: '+8',    color: '#0B9E5E' },
          { label: 'Clients uniques', val: '3 891',       delta: '+5%',   color: '#8B5CF6' },
        ].map((k, i) => (
          <div key={k.label} className="stat-card anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="stat-card-top">
              <div className="stat-card-label" style={{ alignSelf: 'flex-start', marginBottom: 0 }}>{k.label}</div>
              <span className="stat-card-delta pos">{k.delta}</span>
            </div>
            <div className="stat-card-value" style={{ color: k.color, fontSize: '1.5rem', marginTop: '8px' }}>{k.val}</div>
            <div className="stat-card-bar" style={{ background: `linear-gradient(90deg, ${k.color}, ${k.color}88)` }} />
          </div>
        ))}
      </div>

      <div className="dash-two-col" style={{ marginBottom: '24px' }}>

        {/* Bar chart — Commandes par mois */}
        <div className="card anim-fade-up anim-d2">
          <div className="card-header">
            <h2 className="card-title">Commandes par mois</h2>
            <span className="badge badge-primary">Oct 2025 — Avr 2026</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '180px', padding: '0 8px' }}>
              {monthlyData.map((d, i) => {
                const h = Math.round((d.orders / maxOrders) * 140);
                return (
                  <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#0234AB', fontWeight: 700, opacity: 0, animation: `fadeIn 0.4s ease both ${0.3 + i * 0.07}s`, animationFillMode: 'both' }}>
                      {d.orders}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        height: `${h}px`,
                        borderRadius: '6px 6px 0 0',
                        background: i === monthlyData.length - 1
                          ? 'linear-gradient(180deg, #F5A623, #E8891A)'
                          : 'linear-gradient(180deg, #0234AB, #1a4fd4)',
                        animation: `fadeInUp 0.6s cubic-bezier(0.4,0,0.2,1) both ${0.2 + i * 0.07}s`,
                        boxShadow: i === monthlyData.length - 1 ? '0 4px 16px rgba(245,166,35,0.4)' : '0 4px 12px rgba(2,52,171,0.2)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '0.68rem', color: '#8B9AB5', fontWeight: 600 }}>{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Revenue line visualization */}
        <div className="card anim-fade-up anim-d3">
          <div className="card-header">
            <h2 className="card-title">Revenus mensuels (MAD)</h2>
            <span className="badge badge-success">+12% ce mois</span>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '16px' }}>
              {monthlyData.map((d, i) => {
                const pct = Math.round((d.revenue / maxRevenue) * 100);
                return (
                  <div key={d.month} style={{ marginBottom: '10px', animation: `fadeInLeft 0.5s ease both ${0.1 + i * 0.07}s` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4A5568' }}>{d.month}</span>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', fontWeight: 700, color: '#0234AB' }}>
                        {d.revenue.toLocaleString('fr-FR')} MAD
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: i === monthlyData.length - 1
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
            {topArtisans.map((a, i) => (
              <div key={a.name} style={{ marginBottom: '18px', animation: `fadeInUp 0.5s ease both ${0.1 + i * 0.08}s` }}>
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
                      {a.revenue.toLocaleString('fr-FR')} MAD
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#8B9AB5' }}>{a.orders} cmds</div>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${a.pct}%`, animationDelay: `${0.3 + i * 0.08}s` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="card anim-fade-up anim-d5">
          <div className="card-header">
            <h2 className="card-title">Répartition par catégorie</h2>
            <span className="badge badge-primary">Produits</span>
          </div>
          <div className="card-body">
            {/* Donut-style visual */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
              {/* SVG donut */}
              <div style={{ flexShrink: 0 }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  {(() => {
                    let offset = 0;
                    const r = 52;
                    const circ = 2 * Math.PI * r;
                    return categories.map((c, i) => {
                      const dash = (c.pct / 100) * circ;
                      const gap = circ - dash;
                      const rotate = (offset / 100) * 360 - 90;
                      offset += c.pct;
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
                    6
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
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', fontWeight: 700, color: c.color }}>{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
