import Link from 'next/link';
import { StatCard } from '../components/Card';

const recentProducts = [
  { id: 1, name: 'Tajine en céramique',   category: 'Poterie',       price: '350 TND',   status: 'Actif',      orders: 12, color: '#0B9E5E' },
  { id: 2, name: 'Sac en cuir fait main', category: 'Maroquinerie',  price: '580 TND',   status: 'Actif',      orders: 8,  color: '#0B9E5E' },
  { id: 3, name: 'Tapis berbère',          category: 'Textile',       price: '1 200 TND', status: 'En attente', orders: 3,  color: '#F59E0B' },
  { id: 4, name: 'Lanterne en fer forgé',  category: 'Métal',         price: '420 TND',   status: 'Actif',      orders: 15, color: '#0B9E5E' },
];

const recentOrders = [
  { id: '#CMD-001', product: 'Tajine en céramique', customer: 'Sara M.',   total: '350 TND',   status: 'Livré',      statusClass: 'badge-success' },
  { id: '#CMD-002', product: 'Sac en cuir',         customer: 'Khalid B.', total: '580 TND',   status: 'En cours',   statusClass: 'badge-primary' },
  { id: '#CMD-003', product: 'Tapis berbère',        customer: 'Nadia R.',  total: '1 200 TND', status: 'En attente', statusClass: 'badge-warning' },
];

export default function ArtisanDashboard() {
  return (
    <div>
      {/* Header */}
      <div className="page-header anim-fade-up">
        <div>
          <div className="page-greeting">Bonjour, Ahmed ✦</div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Aperçu de vos activités du jour</p>
        </div>
        <Link href="/dashboard/artisan/products/create" className="btn btn-primary btn-lg">
          <span>＋</span> Nouveau Produit
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="◈" label="Produits"  value="24"          delta="+3"    positive color="#0234AB" delay={0.05} />
        <StatCard icon="◉" label="Commandes" value="156"         delta="+12%"  positive color="#0B9E5E" delay={0.1}  />
        <StatCard icon="$" label="Revenus"   value="45 200 TND"  delta="+8%"   positive color="#F5A623" delay={0.15} />
        <StatCard icon="◎" label="Vues"      value="2 340"        delta="+15%"  positive color="#8B5CF6" delay={0.2}  />
      </div>

      {/* Main grid */}
      <div className="artisan-home-grid">
        {/* Products table */}
        <div className="card anim-fade-up anim-d3">
          <div className="card-header">
            <h2 className="card-title">Derniers Produits</h2>
            <Link href="/dashboard/artisan/products" className="see-all">Voir tout →</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Prix</th>
                  <th>Statut</th>
                  <th>Cmds</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map((p, i) => (
                  <tr key={p.id} style={{ animationDelay: `${0.05 + i * 0.06}s` }}>
                    <td>
                      <div className="product-cell">
                        <div className="product-cell-dot" style={{ background: p.color }} />
                        <div>
                          <div className="product-cell-name">{p.name}</div>
                          <div className="product-cell-cat">{p.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="td-mono" style={{ fontSize: '0.8rem', fontWeight: 700 }}>{p.price}</td>
                    <td>
                      <span className={`badge ${p.status === 'Actif' ? 'badge-success' : 'badge-warning'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="td-mono">{p.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="artisan-home-right">
          {/* Orders */}
          <div className="card anim-fade-up anim-d4">
            <div className="card-header">
              <h2 className="card-title">Commandes récentes</h2>
              <Link href="/dashboard/artisan/orders" className="see-all">Voir tout →</Link>
            </div>
            {recentOrders.map((o, i) => (
              <div key={o.id} className="order-item" style={{ animationDelay: `${0.1 + i * 0.07}s` }}>
                <div>
                  <div className="order-id">{o.id}</div>
                  <div className="order-product">{o.product}</div>
                  <div className="order-customer">→ {o.customer}</div>
                </div>
                <div className="order-right">
                  <div className="order-amount">{o.total}</div>
                  <span className={`badge ${o.statusClass}`}>{o.status}</span>
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
              { href: '/dashboard/artisan/products/create', icon: '◈', label: 'Ajouter un produit',   bg: '#0234AB22' },
              { href: '/dashboard/artisan/orders',          icon: '◉', label: 'Gérer les commandes',  bg: '#0B9E5E22' },
              { href: '/dashboard/artisan/profile',         icon: '◎', label: 'Modifier le profil',   bg: '#8B5CF622' },
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
