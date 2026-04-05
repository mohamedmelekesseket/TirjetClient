const orders = [
  { id: '#CMD-001', product: 'Tajine en céramique',   customer: 'Sara Moussaoui',  email: 'sara.m@email.com', date: '02 Avr 2026', total: '350 MAD',   status: 'Livré',      statusClass: 'badge-success' },
  { id: '#CMD-002', product: 'Sac en cuir fait main', customer: 'Khalid Benali',   email: 'k.benali@email.com', date: '01 Avr 2026', total: '580 MAD',   status: 'En cours',   statusClass: 'badge-primary' },
  { id: '#CMD-003', product: 'Tapis berbère',          customer: 'Nadia Rachidi',   email: 'nadia.r@email.com', date: '31 Mar 2026', total: '1 200 MAD', status: 'En attente', statusClass: 'badge-warning' },
  { id: '#CMD-004', product: 'Lanterne en fer forgé',  customer: 'Youssef El Amri', email: 'y.elamri@email.com', date: '30 Mar 2026', total: '420 MAD',   status: 'Livré',      statusClass: 'badge-success' },
  { id: '#CMD-005', product: 'Babouches brodées',      customer: 'Fatima Zahra',    email: 'f.zahra@email.com', date: '29 Mar 2026', total: '280 MAD',   status: 'Annulé',     statusClass: 'badge-danger'  },
  { id: '#CMD-006', product: 'Tajine en céramique',   customer: 'Omar Idrissi',    email: 'omar.i@email.com', date: '28 Mar 2026', total: '350 MAD',   status: 'Livré',      statusClass: 'badge-success' },
];

const miniStats = [
  { label: 'Total commandes', val: '156', color: '#0234AB' },
  { label: 'En cours',        val: '12',  color: '#F59E0B' },
  { label: 'Livrées',         val: '131', color: '#0B9E5E' },
  { label: 'Annulées',        val: '13',  color: '#E53E3E' },
];

const dotColor: Record<string, string> = {
  'Livré': '#0B9E5E',
  'En cours': '#0234AB',
  'En attente': '#F59E0B',
  'Annulé': '#E53E3E',
};

export default function OrdersPage() {
  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Commandes</h1>
          <p className="page-subtitle">Suivez et gérez toutes vos commandes</p>
        </div>
        <div className="header-actions-row">
          <div className="search-bar">
            <span className="search-bar-icon">⌕</span>
            <input className="search-bar-input" placeholder="Rechercher une commande..." />
          </div>
          <button className="btn btn-secondary">⬇ Exporter</button>
        </div>
      </div>

      {/* Mini stats */}
      <div className="orders-stats">
        {miniStats.map((s, i) => (
          <div key={s.label} className="order-stat-mini anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="order-stat-mini-label">{s.label}</div>
            <div className="order-stat-mini-value" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="tabs">
        {['Toutes', 'En attente', 'En cours', 'Livrées', 'Annulées'].map((t, i) => (
          <button key={t} className={`tab${i === 0 ? ' active' : ''}`}>{t}</button>
        ))}
      </div>

      {/* Table */}
      <div className="card anim-fade-up anim-d2">
        <div className="card-header">
          <h2 className="card-title">Liste des commandes</h2>
          <span style={{ fontSize: '0.8rem', color: '#8B9AB5' }}>{orders.length} commandes</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>N° Commande</th>
                <th>Produit</th>
                <th>Client</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={o.id} style={{ animationDelay: `${i * 0.06}s` }}>
                  <td>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', fontWeight: 700, color: '#0234AB' }}>
                      {o.id}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{o.product}</td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{o.customer}</div>
                    <div style={{ fontSize: '0.72rem', color: '#8B9AB5', marginTop: '2px' }}>{o.email}</div>
                  </td>
                  <td style={{ color: '#8B9AB5', fontSize: '0.82rem' }}>{o.date}</td>
                  <td>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.82rem', fontWeight: 700 }}>
                      {o.total}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${o.statusClass}`}>
                      <span className="order-status-dot" style={{ background: dotColor[o.status] || '#8B9AB5' }} />
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <div className="order-actions-cell">
                      <button className="icon-btn" title="Voir">👁</button>
                      <button className="icon-btn" title="Modifier">✎</button>
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
