const products = [
  { id: 1,  name: 'Tajine en céramique',   artisan: 'Ahmed Benali',   category: 'Poterie',       price: 350,  orders: 12, status: 'Publié',   reported: false },
  { id: 2,  name: 'Sac en cuir fait main', artisan: 'Fatima Zahra',   category: 'Maroquinerie',  price: 580,  orders: 8,  status: 'Publié',   reported: false },
  { id: 3,  name: 'Tapis berbère',          artisan: 'Nadia Rachidi',  category: 'Textile',       price: 1200, orders: 3,  status: 'En attente',reported: false },
  { id: 4,  name: 'Lanterne fer forgé',     artisan: 'Omar Idrissi',   category: 'Métal',         price: 420,  orders: 15, status: 'Publié',   reported: true  },
  { id: 5,  name: 'Babouches brodées',      artisan: 'Leila Bouhsini', category: 'Chaussures',    price: 280,  orders: 22, status: 'Publié',   reported: false },
  { id: 6,  name: 'Vase en zellige',        artisan: 'Sara Moussaoui', category: 'Poterie',       price: 650,  orders: 0,  status: 'Suspendu', reported: true  },
  { id: 7,  name: 'Coffret en bois',        artisan: 'Omar Idrissi',   category: 'Bois',          price: 890,  orders: 6,  status: 'Publié',   reported: false },
  { id: 8,  name: 'Collier en argent',      artisan: 'Leila Bouhsini', category: 'Bijoux',        price: 450,  orders: 31, status: 'Publié',   reported: false },
];

const statusClass: Record<string, string> = {
  'Publié': 'badge-success',
  'En attente': 'badge-warning',
  'Suspendu': 'badge-danger',
};

const emojiMap: Record<string, string> = {
  Poterie: '🏺', Maroquinerie: '👜', Textile: '🧵',
  Métal: '🔦', Chaussures: '👡', Bois: '🌿', Bijoux: '💍',
};

export default function AdminProductsPage() {
  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Gestion des Produits</h1>
          <p className="page-subtitle">Modérez et contrôlez les produits de la plateforme</p>
        </div>
        <div className="header-actions-row">
          <div className="search-bar">
            <span className="search-bar-icon">⌕</span>
            <input className="search-bar-input" placeholder="Rechercher un produit..." />
          </div>
          <button className="btn btn-secondary">⬇ Exporter</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total produits', val: '1 284', color: '#0234AB' },
          { label: 'Publiés',        val: '1 101', color: '#0B9E5E' },
          { label: 'En attente',     val: '98',    color: '#F59E0B' },
          { label: 'Signalés',       val: '14',    color: '#E53E3E' },
        ].map((s, i) => (
          <div key={s.label} className="order-stat-mini anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="order-stat-mini-label">{s.label}</div>
            <div className="order-stat-mini-value" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['Tous', 'Publiés', 'En attente', 'Signalés', 'Suspendus'].map((t, i) => (
          <button key={t} className={`tab${i === 0 ? ' active' : ''}`}>{t}</button>
        ))}
      </div>

      {/* Table */}
      <div className="card anim-fade-up anim-d3">
        <div className="card-header">
          <h2 className="card-title">Catalogue complet</h2>
          <span style={{ fontSize: '0.8rem', color: '#8B9AB5' }}>{products.length} résultats</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Artisan</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Commandes</th>
                <th>Signalé</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} style={{ animationDelay: `${i * 0.055}s` }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #EEF2FF, #E0E9FF)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', flexShrink: 0,
                      }}>
                        {emojiMap[p.category] || '🏺'}
                      </div>
                      <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ color: '#4A5568', fontSize: '0.875rem' }}>{p.artisan}</td>
                  <td><span className="badge badge-primary">{p.category}</span></td>
                  <td>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.8rem', fontWeight: 700 }}>
                      {p.price.toLocaleString('fr-FR')} MAD
                    </span>
                  </td>
                  <td className="td-mono">{p.orders}</td>
                  <td>
                    {p.reported
                      ? <span className="badge badge-danger">⚑ Signalé</span>
                      : <span style={{ color: '#8B9AB5', fontSize: '0.82rem' }}>—</span>
                    }
                  </td>
                  <td>
                    <span className={`badge ${statusClass[p.status] || 'badge-gray'}`}>{p.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="icon-btn" title="Voir">👁</button>
                      {p.status === 'En attente' && <button className="btn btn-success btn-sm">✓</button>}
                      {p.reported && <button className="btn btn-danger btn-sm">✕ Retirer</button>}
                      {!p.reported && p.status !== 'En attente' && (
                        <button className="icon-btn danger" title="Supprimer">✕</button>
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
