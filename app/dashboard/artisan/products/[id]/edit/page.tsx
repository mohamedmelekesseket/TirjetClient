'use client';
import Link from 'next/link';
import { useState } from 'react';
import UploadImage from '@/app/dashboard/components/UploadImage';
export default function EditProductPage({ params }: { params: { id: string } }) {
  const [form, setForm] = useState({
    name: 'Tajine en céramique berbère',
    category: 'Poterie',
    price: '350',
    stock: '8',
    description: "Tajine artisanal en céramique, fabriqué à la main par des artisans berbères.",
    status: 'Actif',
  });

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <Link href={`/dashboard/artisan/products/${params.id}`} className="page-back">← Retour au produit</Link>
          <h1 className="page-title">Modifier le Produit</h1>
          <p className="page-subtitle">Mettez à jour les informations de votre produit</p>
        </div>
      </div>

      <div className="create-product-grid">
        <div className="create-product-main">
          <div className="card anim-fade-up anim-d1">
            <div className="card-header">
              <h2 className="card-title">Informations générales</h2>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Nom du produit *</label>
                <input name="name" value={form.name} onChange={handle} className="form-input" />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Catégorie</label>
                  <select name="category" value={form.category} onChange={handle} className="form-select">
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
                <label className="form-label">Description</label>
                <textarea name="description" value={form.description} onChange={handle} className="form-textarea" rows={5} />
              </div>
            </div>
          </div>

          <div className="card anim-fade-up anim-d2">
            <div className="card-header">
              <h2 className="card-title">Photos du produit</h2>
            </div>
            <div className="card-body">
              <div style={{ fontSize: '0.85rem', color: '#8B9AB5', marginBottom: '14px', padding: '10px', background: '#F8FAFF', borderRadius: '8px' }}>
                📷 3 photos actuelles — ajoutez-en ou supprimez
              </div>
              <UploadImage multiple />
            </div>
          </div>
        </div>

        <div className="create-product-side">
          <div className="card anim-fade-up anim-d2">
            <div className="card-header"><h2 className="card-title">Prix & Stock</h2></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Prix (MAD) *</label>
                <div className="input-prefix-wrap">
                  <span className="input-prefix">MAD</span>
                  <input name="price" type="number" value={form.price} onChange={handle} className="form-input" />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Stock</label>
                <input name="stock" type="number" value={form.stock} onChange={handle} className="form-input" />
              </div>
            </div>
          </div>

          <div className="anim-fade-up anim-d3">
            <button className="publish-btn">✦ Sauvegarder les modifications</button>
            <button className="draft-btn">Annuler les changements</button>
          </div>
        </div>
      </div>
    </div>
  );
}
