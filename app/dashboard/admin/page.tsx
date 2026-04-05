import Link from 'next/link';
import { StatCard } from '../components/Card';

const pendingArtisans = [
  { name: 'Karim Essadki',   city: 'Fès',       speciality: 'Poterie',      date: '01 Avr 2026' },
  { name: 'Leila Bouhsini',  city: 'Meknès',    speciality: 'Textile',      date: '31 Mar 2026' },
  { name: 'Hamid Ouazzani',  city: 'Salé',      speciality: 'Maroquinerie', date: '30 Mar 2026' },
];

const recentActivity = [
  { icon: '✓', text: 'Nouveau artisan approuvé — Fatima Z.', time: 'Il y a 2h',  color: '#0B9E5E' },
  { icon: '◈', text: 'Produit signalé — Tapis Azilal',        time: 'Il y a 4h',  color: '#F59E0B' },
  { icon: '✕', text: 'Compte suspendu — M. Rachid',           time: 'Il y a 6h',  color: '#E53E3E' },
  { icon: '★', text: 'Nouvelle commande — 5 articles',         time: 'Il y a 8h',  color: '#8B5CF6' },
  { icon: '▲', text: 'Pic de trafic — +340 vues',             time: 'Il y a 10h', color: '#0234AB' },
];

export default function AdminDashboard() {
  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <div className="page-greeting">Bienvenue, Administrateur ✦</div>
          <h1 className="page-title">Tableau de bord Admin</h1>
          <p className="page-subtitle">Supervision et contrôle de la plateforme Artisana</p>
        </div>
        <div className="header-actions-row">
          <Link href="/dashboard/admin/artisans" className="btn btn-secondary">◈ Artisans</Link>
          <Link href="/dashboard/admin/stats" className="btn btn-primary">◇ Statistiques</Link>
        </div>
      </div>

      {/* Stats 5-col */}
      <div className="admin-stats-grid">
        <StatCard icon="◈" label="Artisans"  value="142"      delta="+8"   positive color="#0234AB" delay={0.05} />
        <StatCard icon="◉" label="Produits"  value="1 284"    delta="+23"  positive color="#0B9E5E" delay={0.1}  />
        <StatCard icon="$" label="Revenus"   value="284 K MAD" delta="+12%" positive color="#F5A623" delay={0.15} />
        <StatCard icon="👥" label="Clients"  value="3 891"    delta="+5%"  positive color="#8B5CF6" delay={0.2}  />
        <StatCard icon="★" label="Note moy." value="4.7 / 5"  delta="+0.2" positive color="#EF4444" delay={0.25} />
      </div>

      {/* Two-col grid */}
      <div className="admin-grid">
        {/* Pending artisans */}
        <div className="card anim-fade-up anim-d3">
          <div className="card-header">
            <div>
              <h2 className="card-title">Artisans en attente</h2>
              <div className="card-subtitle">3 demandes à valider</div>
            </div>
            <span className="badge badge-warning">⚑ Urgent</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {pendingArtisans.map((a, i) => (
              <div key={a.name} className="order-item" style={{ animationDelay: `${i * 0.08}s` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '13px',
                    background: 'linear-gradient(135deg, #0234AB, #1a4fd4)',
                    color: 'white', fontWeight: 700, fontSize: '1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Playfair Display', serif", flexShrink: 0,
                  }}>
                    {a.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8B9AB5', marginTop: '2px' }}>
                      {a.city} · {a.speciality}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="btn btn-success btn-sm">✓</button>
                  <button className="btn btn-danger btn-sm">✕</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 22px', borderTop: '1px solid rgba(2,52,171,0.06)' }}>
            <Link href="/dashboard/admin/artisans" className="see-all">Voir toutes les demandes →</Link>
          </div>
        </div>

        {/* Activity feed */}
        <div className="card anim-fade-up anim-d4">
          <div className="card-header">
            <h2 className="card-title">Activité récente</h2>
            <span className="badge badge-primary">Live</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {recentActivity.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '13px 22px',
                borderBottom: '1px solid rgba(2,52,171,0.05)',
                animation: 'rowSlide 0.4s ease both',
                animationDelay: `${i * 0.07}s`,
              }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '10px',
                  background: `${a.color}18`,
                  color: a.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 700, flexShrink: 0,
                }}>
                  {a.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#0A0F2C' }}>{a.text}</div>
                  <div style={{ fontSize: '0.72rem', color: '#8B9AB5', marginTop: '2px' }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick nav cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }} className="anim-fade-up anim-d5">
        {[
          { href: '/dashboard/admin/artisans', icon: '◈', label: 'Gérer artisans',   sub: '142 artisans', color: '#0234AB' },
          { href: '/dashboard/admin/products', icon: '◉', label: 'Gérer produits',   sub: '1 284 produits', color: '#0B9E5E' },
          { href: '/dashboard/admin/users',    icon: '◎', label: 'Gérer utilisateurs', sub: '3 891 comptes', color: '#8B5CF6' },
          { href: '/dashboard/admin/stats',    icon: '◇', label: 'Statistiques',     sub: 'Voir les données', color: '#F5A623' },
        ].map((item, i) => (
          <Link key={item.href} href={item.href}
            className="card"
            style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', animationDelay: `${0.3 + i * 0.07}s`, textDecoration: 'none' }}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: `${item.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', color: item.color,
            }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#0A0F2C', fontSize: '0.9rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.78rem', color: '#8B9AB5', marginTop: '3px' }}>{item.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
