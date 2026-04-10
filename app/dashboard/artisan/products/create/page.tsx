'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, X, ImagePlus } from 'lucide-react';

// ── Config ────────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const CATEGORIES = ['margoum', 'fokhar', 'bijoux', 'tissage'] as const;
type Category = (typeof CATEGORIES)[number];

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormState {
  title:       string;
  category:    Category | '';
  price:       string;
  stock:       string;
  description: string;
}

interface FieldError {
  title?:       string;
  category?:    string;
  price?:       string;
  description?: string;
}

// ── Validation ────────────────────────────────────────────────────────────────
function validate(form: FormState): FieldError {
  const errors: FieldError = {};
  if (!form.title.trim())       errors.title       = 'Le nom est requis.';
  if (!form.category)           errors.category    = 'La catégorie est requise.';
  if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
                                errors.price       = 'Prix invalide.';
  if (!form.description.trim()) errors.description = 'La description est requise.';
  return errors;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CreateProductPage() {
  const router   = useRouter();
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [form, setForm] = useState<FormState>({
    title: '', category: '', price: '', stock: '', description: '',
  });
  const [images, setImages]       = useState<File[]>([]);
  const [previews, setPreviews]   = useState<string[]>([]);
  const [errors, setErrors]       = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const getHeaders = () => ({ Authorization: `Bearer ${apiToken}` });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handle = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles    = Array.from(files).slice(0, 8 - images.length);
    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    setImages(prev  => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setImages(prev   => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const submit = async () => {
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }

    try {
      setSubmitting(true);
      setServerError(null);

      const body = new FormData();
      body.append('title',       form.title.trim());
      body.append('category',    form.category);
      body.append('price',       form.price);
      body.append('stock',       form.stock || '1');
      body.append('description', form.description.trim());
      images.forEach(img => body.append('images', img));

      const res = await fetch(`${API}/api/products`, {
        method:  'POST',
        headers: getHeaders(),   // ← no Content-Type: let the browser set multipart boundary
        body,
      });

      if (res.status === 401) throw new Error('Non autorisé — session expirée ?');
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message ?? `Erreur ${res.status}`);
      }

      router.push('/dashboard/artisan/products');
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); submit(); };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="page-header anim-fade-up">
        <div>
          <Link href="/dashboard/artisan/products" className="page-back">
            ← Retour aux produits
          </Link>
          <h1 className="page-title">Nouveau Produit</h1>
          <p className="page-subtitle">Ajoutez un produit à votre catalogue artisanal</p>
        </div>
      </div>

      {/* Server error banner */}
      {serverError && (
        <div
          className="card anim-fade-up"
          style={{ marginBottom: '1rem', color: 'var(--color-error,#e53e3e)', padding: '1rem' }}
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="create-product-grid">

          {/* ── Main column ───────────────────────────────────────────────── */}
          <div className="create-product-main">

            {/* General info */}
            <div className="card anim-fade-up anim-d1">
              <div className="card-header">
                <h2 className="card-title">Informations générales</h2>
              </div>
              <div className="card-body">

                {/* Title */}
                <div className="form-group">
                  <label className="form-label">Nom du produit *</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handle}
                    className={`form-input${errors.title ? ' input-error' : ''}`}
                    placeholder="Ex: Tajine en céramique berbère"
                  />
                  {errors.title && <span className="form-error">{errors.title}</span>}
                </div>

                {/* Category */}
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Catégorie *</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handle}
                      className={`form-select${errors.category ? ' input-error' : ''}`}
                    >
                      <option value="">Sélectionner...</option>
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </option>
                      ))}
                    </select>
                    {errors.category && <span className="form-error">{errors.category}</span>}
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handle}
                    className={`form-textarea${errors.description ? ' input-error' : ''}`}
                    rows={5}
                    placeholder="Décrivez votre produit, son histoire, ses matériaux, sa technique de fabrication..."
                  />
                  {errors.description && <span className="form-error">{errors.description}</span>}
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="card anim-fade-up anim-d2">
              <div className="card-header">
                <h2 className="card-title">Photos du produit</h2>
                <span className="card-hint">{images.length}/8 — au moins 3 conseillées</span>
              </div>
              <div className="card-body">

                {/* Drop zone */}
                {images.length < 8 && (
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
                    style={{
                      border: '2px dashed var(--color-border,#e2e8f0)',
                      borderRadius: 12,
                      padding: '2rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      marginBottom: previews.length ? '1rem' : 0,
                    }}
                  >
                    <ImagePlus size={28} style={{ margin: '0 auto .5rem', opacity: 0.4 }} />
                    <p style={{ opacity: 0.6, fontSize: '.9rem' }}>
                      Glissez des photos ici ou <strong>cliquez pour choisir</strong>
                    </p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={e => handleFiles(e.target.files)}
                    />
                  </div>
                )}

                {/* Previews */}
                {previews.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: 10,
                  }}>
                    {previews.map((src, i) => (
                      <div
                        key={src}
                        style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1' }}
                      >
                        <img
                          src={src}
                          alt={`preview-${i}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          style={{
                            position: 'absolute', top: 4, right: 4,
                            background: 'rgba(0,0,0,.55)', border: 'none',
                            borderRadius: '50%', width: 22, height: 22,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#fff',
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Side column ───────────────────────────────────────────────── */}
          <div className="create-product-side">

            {/* Price & Stock */}
            <div className="card anim-fade-up anim-d2">
              <div className="card-header">
                <h2 className="card-title">Prix & Stock</h2>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Prix (TND) *</label>
                  <div className="input-prefix-wrap">
                    <span className="input-prefix">TND</span>
                    <input
                      name="price"
                      type="number"
                      min={0}
                      value={form.price}
                      onChange={handle}
                      className={`form-input${errors.price ? ' input-error' : ''}`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.price && <span className="form-error">{errors.price}</span>}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Stock disponible</label>
                  <input
                    name="stock"
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={handle}
                    className="form-input"
                    placeholder="Quantité"
                  />
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
              <button
                type="submit"
                className="publish-btn"
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {submitting
                  ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  : '✦'}
                {submitting ? 'Publication…' : 'Publier le produit'}
              </button>
              <button
                type="button"
                className="draft-btn"
                disabled={submitting}
                onClick={submit}
              >
                Sauvegarder le brouillon
              </button>
            </div>
          </div>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}