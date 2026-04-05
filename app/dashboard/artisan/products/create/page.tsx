'use client';
import Link from 'next/link';
import { useState } from 'react';
import UploadImage from '@/app/dashboard/components/UploadImage';

export default function CreateProductPage() {
  const [form, setForm] = useState({ name: '', category: '', price: '', stock: '', description: '', status: 'Actif' });
  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <Link href="/dashboard/artisan/products" className="page-back">← Retour aux produits</Link>
          <h1 className="page-title">Nouveau Produit</h1>
          <p className="page-subtitle">Ajoutez un produit à votre catalogue artisanal</p>
        </div>
      </div>

      <div className="create-product-grid">
        {/* Main column */}
        <div className="create-product-main">
          {/* General info */}
          <div className="card anim-fade-up anim-d1">
            <div className="card-header">
              <h2 className="card-title">Informations générales</h2>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Nom du produit *</label>
                <input name="name" value={form.name} onChange={handle} className="form-input" placeholder="Ex: Tajine en céramique berbère" />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Catégorie *</label>
                  <select name="category" value={form.category} onChange={handle} className="form-select">
                    <option value="">Sélectionner...</option>
                    {['Poterie', 'Maroquinerie', 'Textile', 'Métal', 'Bois', 'Bijoux', 'Chaussures'].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Statut</label>
                  <select name="status" value={form.status} onChange={handle} className="form-select">
                    <option>Actif</option>
                    <option>En attente</option>
                    <option>Inactif</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handle}
                  className="form-textarea"
                  rows={5}
                  placeholder="Décrivez votre produit, son histoire, ses matériaux, sa technique de fabrication..."
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="card anim-fade-up anim-d2">
            <div className="card-header">
              <h2 className="card-title">Photos du produit</h2>
              <span className="card-hint">Conseillé: au moins 3 photos</span>
            </div>
            <div className="card-body">
              <UploadImage multiple />
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="create-product-side">
          {/* Price & stock */}
          <div className="card anim-fade-up anim-d2">
            <div className="card-header">
              <h2 className="card-title">Prix & Stock</h2>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Prix (MAD) *</label>
                <div className="input-prefix-wrap">
                  <span className="input-prefix">MAD</span>
                  <input name="price" type="number" value={form.price} onChange={handle} className="form-input" placeholder="0.00" />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Stock disponible</label>
                <input name="stock" type="number" value={form.stock} onChange={handle} className="form-input" placeholder="Quantité" />
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="tips-card anim-fade-up anim-d3">
            <div className="tips-card-icon">✦</div>
            <div className="tips-card-title">Conseils vendeur</div>
            <ul className="tips-card-list">
              <li>Photos de haute qualité</li>
              <li>Décrivez les matériaux</li>
              <li>Mentionnez la technique</li>
              <li>Partagez votre histoire</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="anim-fade-up anim-d4">
            <button className="publish-btn">✦ Publier le produit</button>
            <button className="draft-btn">Sauvegarder le brouillon</button>
          </div>
        </div>
      </div>
    </div>
  );
}
