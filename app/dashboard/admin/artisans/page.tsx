const artisans = [
  { id: 1, name: 'Ahmed Benali',    city: 'Marrakech', speciality: 'Poterie',      products: 24, orders: 156, revenue: '45 200', status: 'Actif',      joined: 'Jan 2025', rating: 4.8 },
  { id: 2, name: 'Fatima Zahra',   city: 'Fès',       speciality: 'Textile',      products: 18, orders: 89,  revenue: '28 400', status: 'Actif',      joined: 'Mar 2025', rating: 4.6 },
  { id: 3, name: 'Karim Essadki',  city: 'Meknès',    speciality: 'Maroquinerie', products: 0,  orders: 0,   revenue: '0',      status: 'En attente', joined: 'Avr 2026', rating: 0   },
  { id: 4, name: 'Leila Bouhsini', city: 'Rabat',     speciality: 'Bijoux',       products: 31, orders: 204, revenue: '62 100', status: 'Actif',      joined: 'Nov 2024', rating: 4.9 },
  { id: 5, name: 'Hamid Ouazzani', city: 'Salé',      speciality: 'Bois',         products: 0,  orders: 0,   revenue: '0',      status: 'En attente', joined: 'Avr 2026', rating: 0   },
  { id: 6, name: 'Sara Moussaoui', city: 'Agadir',    speciality: 'Céramique',    products: 12, orders: 67,  revenue: '19 800', status: 'Suspendu',   joined: 'Fév 2025', rating: 3.9 },
  { id: 7, name: 'Omar Idrissi',   city: 'Tanger',    speciality: 'Métal',        products: 9,  orders: 44,  revenue: '13 200', status: 'Actif',      joined: 'Sep 2025', rating: 4.5 },
  { id: 8, name: 'Nadia Rachidi',  city: 'Casablanca',speciality: 'Poterie',      products: 22, orders: 138, revenue: '41 400', status: 'Actif',      joined: 'Juin 2025',rating: 4.7 },
];

const statusClass: Record<string, string> = {
  'Actif': 'badge-success',
  'En attente': 'badge-warning',
  'Suspendu': 'badge-danger',
};

const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2);

export default function AdminArtisansPage() {
  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Gestion des Artisans</h1>
          <p className="page-subtitle">{artisans.length} artisans inscrits sur la plateforme</p>
        </div>
        <div className="header-actions-row">
          <div className="search-bar">
            <span className="search-bar-icon">⌕</span>
            <input className="search-bar-input" placeholder="Rechercher un artisan..." />
          </div>
          <button className="btn btn-secondary">⬇ Exporter</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total artisans', val: '142', color: '#0234AB', icon: '◈' },
          { label: 'Actifs',         val: '118', color: '#0B9E5E', icon: '✓' },
          { label: 'En attente',     val: '16',  color: '#F59E0B', icon: '⏳' },
          { label: 'Suspendus',      val: '8',   color: '#E53E3E', icon: '✕' },
        ].map((s, i) => (
          <div key={s.label} className="order-stat-mini anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div className="order-stat-mini-label">{s.label}</div>
              <span style={{ fontSize: '1rem', color: s.color }}>{s.icon}</span>
            </div>
            <div className="order-stat-mini-value" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="tabs">
        {['Tous', 'Actif', 'En attente', 'Suspendu'].map((t, i) => (
          <button key={t} className={`tab${i === 0 ? ' active' : ''}`}>{t}</button>
        ))}
      </div>

      {/* Table */}
      <div className="card anim-fade-up anim-d3">
        <div className="card-header">
          <h2 className="card-title">Liste des artisans</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Artisan</th>
                <th>Ville</th>
                <th>Spécialité</th>
                <th>Produits</th>
                <th>Commandes</th>
                <th>Revenu (MAD)</th>
                <th>Note</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {artisans.map((a, i) => (
                <tr key={a.id} style={{ animationDelay: `${i * 0.055}s` }}>
                  <td>
                    <div className="user-cell">
                      <div className="user-row-avatar">{initials(a.name)}</div>
                      <div>
                        <div className="user-cell-name">{a.name}</div>
                        <div className="user-cell-email">Depuis {a.joined}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#4A5568', fontSize: '0.875rem' }}>{a.city}</td>
                  <td>
                    <span className="badge badge-primary">{a.speciality}</span>
                  </td>
                  <td className="td-mono">{a.products}</td>
                  <td className="td-mono">{a.orders}</td>
                  <td>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.8rem', fontWeight: 700, color: '#0B9E5E' }}>
                      {a.revenue !== '0' ? `${a.revenue} MAD` : '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.82rem', fontWeight: 700, color: a.rating >= 4.5 ? '#0B9E5E' : a.rating > 0 ? '#F59E0B' : '#8B9AB5' }}>
                      {a.rating > 0 ? `${a.rating} ★` : '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${statusClass[a.status] || 'badge-gray'}`}>{a.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {a.status === 'En attente' && (
                        <>
                          <button className="btn btn-success btn-sm">✓ Valider</button>
                          <button className="btn btn-danger btn-sm">✕</button>
                        </>
                      )}
                      {a.status !== 'En attente' && (
                        <>
                          <button className="icon-btn" title="Voir">👁</button>
                          <button className="icon-btn danger" title="Suspendre">⊘</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
