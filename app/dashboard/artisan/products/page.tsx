import Link from 'next/link';
import type { ComponentType } from "react";
import { Axe, Package, Search, Shirt, ShoppingBag, Lamp, Sparkles, Plus, Pencil, X } from "lucide-react";

const products = [
  { id: 1, name: 'Tajine en céramique',   category: 'Poterie',       price: 350,  status: 'Actif',      orders: 12, views: 234, stock: 8  },
  { id: 2, name: 'Sac en cuir fait main', category: 'Maroquinerie',  price: 580,  status: 'Actif',      orders: 8,  views: 187, stock: 3  },
  { id: 3, name: 'Tapis berbère',          category: 'Textile',       price: 1200, status: 'En attente', orders: 3,  views: 95,  stock: 2  },
  { id: 4, name: 'Lanterne en fer forgé',  category: 'Métal',         price: 420,  status: 'Actif',      orders: 15, views: 312, stock: 12 },
  { id: 5, name: 'Babouches brodées',      category: 'Chaussures',    price: 280,  status: 'Actif',      orders: 22, views: 445, stock: 20 },
  { id: 6, name: 'Vase en zellige',        category: 'Poterie',       price: 650,  status: 'Inactif',    orders: 0,  views: 58,  stock: 5  },
];

const statusBadge = (s: string) =>
  s === 'Actif' ? 'badge-success' : s === 'En attente' ? 'badge-warning' : 'badge-gray';

const categoryIcon: Record<string, ComponentType<{ size?: number }>> = {
  Poterie: Package,
  Maroquinerie: ShoppingBag,
  Textile: Shirt,
  Métal: Lamp,
  Chaussures: Sparkles,
  Bois: Axe,
};

export default function ProductsPage() {
  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Mes Produits</h1>
          <p className="page-subtitle">{products.length} produits dans votre catalogue</p>
        </div>
        <div className="header-actions-row">
          <div className="search-bar">
            <span className="search-bar-icon" aria-hidden="true">
              <Search size={16} />
            </span>
            <input className="search-bar-input" placeholder="Rechercher un produit..." />
          </div>
          <Link href="/dashboard/artisan/products/create" className="btn btn-primary">
            <Plus size={16} style={{ marginRight: 8 }} aria-hidden="true" />
            Nouveau produit
          </Link>
        </div>
      </div>

      <div className="tabs">
        {['Tous', 'Actif', 'En attente', 'Inactif'].map((t, i) => (
          <button key={t} className={`tab${i === 0 ? ' active' : ''}`}>{t}</button>
        ))}
      </div>

      <div className="products-grid">
        {products.map((p, i) => (
          <div key={p.id} className="product-card anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="product-card-image">
              <div className="product-card-image-inner">
                {(() => {
                  const Icon = categoryIcon[p.category] || Package;
                  return <Icon size={22} />;
                })()}
              </div>
              <div className="product-card-status">
                <span className={`badge ${statusBadge(p.status)}`}>{p.status}</span>
              </div>
            </div>

            <div className="product-card-body">
              <div className="product-card-cat">{p.category}</div>
              <div className="product-card-name">{p.name}</div>
              <div className="product-card-price">{p.price.toLocaleString('fr-FR')} MAD</div>

              <div className="product-card-meta">
                <div className="product-card-meta-item">
                  <span className="product-card-meta-label">Commandes</span>
                  <span className="product-card-meta-val">{p.orders}</span>
                </div>
                <div className="product-card-meta-item">
                  <span className="product-card-meta-label">Vues</span>
                  <span className="product-card-meta-val">{p.views}</span>
                </div>
                <div className="product-card-meta-item">
                  <span className="product-card-meta-label">Stock</span>
                  <span className={`product-card-meta-val${p.stock < 5 ? ' low' : ''}`}>{p.stock}</span>
                </div>
              </div>

              <div className="product-card-actions">
                <Link href={`/dashboard/artisan/products/${p.id}/edit`} className="product-edit-btn">
                  <Pencil size={14} style={{ marginRight: 6 }} aria-hidden="true" />
                  Modifier
                </Link>
                <button className="product-delete-btn" aria-label="Supprimer">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
