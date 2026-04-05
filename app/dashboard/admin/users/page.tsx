const users = [
  { id: 1,  name: 'Sara Moussaoui',  email: 'sara.m@email.com',    role: 'Client',    orders: 8,  spent: '4 200', joined: '10 Jan 2025', status: 'Actif' },
  { id: 2,  name: 'Khalid Benali',   email: 'k.benali@email.com',  role: 'Client',    orders: 3,  spent: '1 740', joined: '22 Feb 2025', status: 'Actif' },
  { id: 3,  name: 'Nadia Rachidi',   email: 'nadia.r@email.com',   role: 'Artisan',   orders: 0,  spent: '0',     joined: '15 Mar 2025', status: 'Actif' },
  { id: 4,  name: 'Youssef El Amri', email: 'y.elamri@email.com',  role: 'Client',    orders: 12, spent: '6 980', joined: '02 Avr 2025', status: 'Actif' },
  { id: 5,  name: 'Fatima Zahra',    email: 'f.zahra@email.com',   role: 'Artisan',   orders: 0,  spent: '0',     joined: '18 Mai 2025', status: 'Actif' },
  { id: 6,  name: 'Rachid Benmoussa',email: 'r.ben@email.com',     role: 'Client',    orders: 1,  spent: '350',   joined: '30 Jun 2025', status: 'Suspendu' },
  { id: 7,  name: 'Amina Tazi',      email: 'a.tazi@email.com',    role: 'Client',    orders: 5,  spent: '2 900', joined: '14 Sep 2025', status: 'Actif' },
  { id: 8,  name: 'Admin Principal', email: 'admin@artisana.ma',   role: 'Admin',     orders: 0,  spent: '0',     joined: '01 Jan 2024', status: 'Actif' },
];

const roleColors: Record<string, string> = {
  'Client': 'badge-primary',
  'Artisan': 'badge-success',
  'Admin': 'badge-purple',
};

const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

export default function AdminUsersPage() {
  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Gestion des Utilisateurs</h1>
          <p className="page-subtitle">Administrez tous les comptes de la plateforme</p>
        </div>
        <div className="header-actions-row">
          <div className="search-bar">
            <span className="search-bar-icon">⌕</span>
            <input className="search-bar-input" placeholder="Rechercher un utilisateur..." />
          </div>
          <button className="btn btn-secondary">⬇ Exporter</button>
          <button className="btn btn-primary">＋ Créer un compte</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total comptes', val: '3 891', color: '#0234AB' },
          { label: 'Clients',       val: '3 631', color: '#8B5CF6' },
          { label: 'Artisans',      val: '142',   color: '#0B9E5E' },
          { label: 'Suspendus',     val: '28',    color: '#E53E3E' },
        ].map((s, i) => (
          <div key={s.label} className="order-stat-mini anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="order-stat-mini-label">{s.label}</div>
            <div className="order-stat-mini-value" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['Tous', 'Clients', 'Artisans', 'Admins', 'Suspendus'].map((t, i) => (
          <button key={t} className={`tab${i === 0 ? ' active' : ''}`}>{t}</button>
        ))}
      </div>

      {/* Table */}
      <div className="card anim-fade-up anim-d3">
        <div className="card-header">
          <h2 className="card-title">Tous les utilisateurs</h2>
          <span style={{ fontSize: '0.8rem', color: '#8B9AB5' }}>{users.length} affiché(s)</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Commandes</th>
                <th>Dépenses</th>
                <th>Inscrit le</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ animationDelay: `${i * 0.055}s` }}>
                  <td>
                    <div className="user-cell">
                      <div
                        className="user-row-avatar"
                        style={{
                          background: u.role === 'Admin'
                            ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
                            : u.role === 'Artisan'
                            ? 'linear-gradient(135deg, #0B9E5E, #047857)'
                            : 'linear-gradient(135deg, #0234AB, #1a4fd4)',
                        }}
                      >
                        {initials(u.name)}
                      </div>
                      <div>
                        <div className="user-cell-name">{u.name}</div>
                        <div className="user-cell-email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${roleColors[u.role]}`}>{u.role}</span></td>
                  <td className="td-mono">{u.orders > 0 ? u.orders : '—'}</td>
                  <td>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.8rem', fontWeight: 700, color: u.spent !== '0' ? '#0B9E5E' : '#8B9AB5' }}>
                      {u.spent !== '0' ? `${u.spent} MAD` : '—'}
                    </span>
                  </td>
                  <td style={{ color: '#8B9AB5', fontSize: '0.82rem' }}>{u.joined}</td>
                  <td>
                    <span className={`badge ${u.status === 'Actif' ? 'badge-success' : 'badge-danger'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="icon-btn" title="Voir profil">👁</button>
                      {u.role !== 'Admin' && (
                        <button
                          className={`icon-btn${u.status === 'Actif' ? ' danger' : ''}`}
                          title={u.status === 'Actif' ? 'Suspendre' : 'Réactiver'}
                        >
                          {u.status === 'Actif' ? '⊘' : '✓'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderTop: '1px solid rgba(2,52,171,0.07)' }}>
          <span style={{ fontSize: '0.82rem', color: '#8B9AB5' }}>Affichage 1–8 sur 3 891</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['←', '1', '2', '3', '...', '487', '→'].map((p, i) => (
              <button
                key={i}
                className="icon-btn"
                style={{
                  background: p === '1' ? '#0234AB' : 'white',
                  color: p === '1' ? 'white' : '#4A5568',
                  borderColor: p === '1' ? 'transparent' : 'rgba(2,52,171,0.12)',
                  fontSize: '0.82rem',
                  fontWeight: p === '1' ? 700 : 400,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
