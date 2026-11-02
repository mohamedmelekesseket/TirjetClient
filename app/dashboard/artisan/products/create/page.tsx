'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApiToken } from '@/lib/useApiToken';
import { Loader2, X, ImagePlus } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface SubcategoryL4 { _id: string; name: string; slug: string; }
interface SubcategoryL3 { _id: string; name: string; slug: string; subcategories: SubcategoryL4[]; }
interface SubcategoryL2 { _id: string; name: string; slug: string; subcategories: SubcategoryL3[]; }
interface Category { _id: string; name: string; subcategories: SubcategoryL2[]; isActive: boolean; }

interface FormState {
  title: string;
  categoryId: string;
  subcategoryL2Slug: string;
  subcategoryL3Slug: string;
  subcategoryL4Slug: string;
  price: string;
  solde: string;
  stock: string;
  description: string;
  location: string;
  material: string;
  dimensions: string;
  colors: string;
  tags: string;
}

interface ToastItem { id: number; type: 'error' | 'success'; message: string; }

interface FieldError {
  title?: string;
  categoryId?: string;
  price?: string;
  description?: string;
  images?: string;
}

function validate(form: FormState, imageCount: number): FieldError {
  const errors: FieldError = {};
  if (!form.title.trim())       errors.title      = 'Le nom est requis.';
  if (!form.categoryId)         errors.categoryId = 'La catégorie est requise.';
  if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
                                errors.price      = 'Prix invalide.';
  if (!form.description.trim()) errors.description = 'La description est requise.';
  if (imageCount < 1)           errors.images     = 'Au moins une photo est requise.';
  return errors;
}

export default function CreateProductPage() {
  const router = useRouter();
  const { apiToken } = useApiToken();

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>({
    title: '', categoryId: '',
    subcategoryL2Slug: '', subcategoryL3Slug: '', subcategoryL4Slug: '',
    price: '', solde: '', stock: '', description: '',
    location: '', material: '', dimensions: '', colors: '', tags: '',
  });
  const [images, setImages]         = useState<File[]>([]);
  const [previews, setPreviews]     = useState<string[]>([]);
  const [errors, setErrors]     = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [toastItem, setToastItem] = useState<ToastItem | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Built-in toast (no external library): bottom, 2s, one at a time
  const showToast = (type: 'error' | 'success', message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastItem({ id: Date.now(), type, message });
    toastTimer.current = setTimeout(() => setToastItem(null), 2000);
  };
  const toast = {
    error:   (m: string) => showToast('error', m),
    success: (m: string) => showToast('success', m),
  };

  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.data) setCategories(data.data.filter((c: Category) => c.isActive)); })
      .catch(() => {});
  }, []);

  // Derived subcategory lists based on current selections
  const selectedCategory = categories.find(c => c._id === form.categoryId);
  const l2List = selectedCategory?.subcategories ?? [];
  const selectedL2 = l2List.find(s => s.slug === form.subcategoryL2Slug);
  const l3List = selectedL2?.subcategories ?? [];
  const selectedL3 = l3List.find(s => s.slug === form.subcategoryL3Slug);
  const l4List = selectedL3?.subcategories ?? [];

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => {
      const next = { ...f, [name]: value };
      // Reset deeper levels when a parent changes
      if (name === 'categoryId')         { next.subcategoryL2Slug = ''; next.subcategoryL3Slug = ''; next.subcategoryL4Slug = ''; }
      if (name === 'subcategoryL2Slug')  { next.subcategoryL3Slug = ''; next.subcategoryL4Slug = ''; }
      if (name === 'subcategoryL3Slug')  { next.subcategoryL4Slug = ''; }
      return next;
    });
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    if (files.length > 8 - images.length) toast.error('Maximum 8 photos.');
    const newFiles    = Array.from(files).slice(0, 8 - images.length);
    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    setImages(prev  => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
    if (newFiles.length) setErrors(prev => ({ ...prev, images: undefined }));
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

  const submit = async () => {
    const fieldErrors = validate(form, images.length);
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      const firstError = Object.values(fieldErrors)[0];
      if (firstError) toast.error(firstError);
      return;
    }
    try {
      setSubmitting(true);
      const body = new FormData();
      body.append('title',       form.title.trim());
      body.append('category',    form.categoryId);
      body.append('price',       form.price);
      body.append('stock',       form.stock || '1');
      body.append('description', form.description.trim());

      // New fields
      if (form.solde) body.append('solde', form.solde);
      if (form.location) body.append('location', form.location.trim());
      if (form.material) body.append('material', form.material.trim());
      if (form.dimensions) body.append('dimensions', form.dimensions.trim());
      if (form.colors) body.append('colors', form.colors);
      if (form.tags) body.append('tags', form.tags);

      // L2
      if (form.subcategoryL2Slug) {
        body.append('subcategoryL2Slug', form.subcategoryL2Slug);
        body.append('subcategoryL2Name', selectedL2?.name ?? '');
      }
      // L3
      if (form.subcategoryL3Slug) {
        body.append('subcategoryL3Slug', form.subcategoryL3Slug);
        body.append('subcategoryL3Name', selectedL3?.name ?? '');
      }
      // L4
      if (form.subcategoryL4Slug) {
        const l4 = l4List.find(s => s.slug === form.subcategoryL4Slug);
        body.append('subcategoryL4Slug', form.subcategoryL4Slug);
        body.append('subcategoryL4Name', l4?.name ?? '');
      }

      images.forEach(img => body.append('images', img));

      const res = await fetch(`${API}/api/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiToken}` },
        body,
      });

      if (res.status === 401) throw new Error('Non autorisé — session expirée ?');
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message ?? `Erreur ${res.status}`);
      }
      toast.success('Produit publié avec succès !');
      setTimeout(() => router.push('/dashboard/artisan/products'), 1200);
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Toast (bottom, 2s, one at a time) */}
      {toastItem && (
        <div key={toastItem.id} className={`app-toast app-toast-${toastItem.type}`} role="alert">
          <span className="app-toast-icon">{toastItem.type === 'error' ? '!' : '✓'}</span>
          <span className="app-toast-msg">{toastItem.message}</span>
          <span className="app-toast-bar" />
        </div>
      )}
      <div className="page-header anim-fade-up">
        <div>
          <Link href="/dashboard/artisan/products" className="page-back">← Retour aux produits</Link>
          <h1 className="page-title">Nouveau Produit</h1>
          <p className="page-subtitle">Ajoutez un produit à votre catalogue artisanal</p>
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); submit(); }} noValidate>
        <div className="create-product-grid">
          <div className="create-product-main">

            {/* General info */}
            <div className="card anim-fade-up anim-d1" style={{background:"#18203A"}}>
              <div className="card-header"><h2 className="card-title" style={{color:"white"}}>Informations générales</h2></div>
              <div className="card-body">

                <div className="form-group">
                  <label className="form-label">Nom du produit *</label>
                  <input
                    name="title" value={form.title} onChange={handle}
                    className={`form-input${errors.title ? ' input-error' : ''}`}
                    placeholder="Ex: Tajine en céramique berbère"
                  />
                  {errors.title && <span className="form-error">{errors.title}</span>}
                </div>

                {/* L1 Category */}
                <div className="form-group">
                  <label className="form-label">Catégorie *</label>
                  <select
                    name="categoryId" style={{color:"white"}} value={form.categoryId} onChange={handle}
                    className={`form-select${errors.categoryId ? ' input-error' : ''}`}
                  >
                    <option value="">Sélectionner...</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && <span className="form-error">{errors.categoryId}</span>}
                </div>

                {/* L2 Subcategory */}
                {l2List.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Sous-catégorie</label>
                    <select
                      name="subcategoryL2Slug" style={{color:"white"}} value={form.subcategoryL2Slug} onChange={handle}
                      className="form-select"
                    >
                      <option value="">Toutes</option>
                      {l2List.map(s => (
                        <option key={s._id} value={s.slug}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* L3 Subcategory */}
                {l3List.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Sous-catégorie (niveau 3)</label>
                    <select
                      name="subcategoryL3Slug" style={{color:"white"}}  value={form.subcategoryL3Slug} onChange={handle}
                      className="form-select"
                    >
                      <option value="">Toutes</option>
                      {l3List.map(s => (
                        <option key={s._id} value={s.slug}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* L4 Subcategory */}
                {l4List.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Sous-catégorie (niveau 4)</label>
                    <select
                      name="subcategoryL4Slug" style={{color:"white"}} value={form.subcategoryL4Slug} onChange={handle}
                      className="form-select"
                    >
                      <option value="">Toutes</option>
                      {l4List.map(s => (
                        <option key={s._id} value={s.slug}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea
                    name="description" style={{color:"white"}} value={form.description} onChange={handle}
                    className={`form-textarea${errors.description ? ' input-error' : ''}`}
                    rows={5}
                    placeholder="Décrivez votre produit, son histoire, ses matériaux..."
                  />
                  {errors.description && <span className="form-error">{errors.description}</span>}
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="card anim-fade-up anim-d2" style={{background:"#18203A"}}>
              <div className="card-header">
                <h2 className="card-title" style={{color:"white"}}>Photos du produit *</h2>
                <span className="card-hint">{images.length}/8 — au moins 1 requise, 3 conseillées</span>
              </div>
              <div className="card-body">
                {images.length < 8 && (
                  <div
                    onDragOver={e => e.preventDefault()} onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
                    style={{
                      border: `2px dashed ${errors.images ? '#e53e3e' : 'var(--color-border,#e2e8f0)'}`,
                      borderRadius: 12,
                      padding: '2rem', textAlign: 'center', cursor: 'pointer',
                      marginBottom: previews.length ? '1rem' : 0,
                    }}
                  >
                    <ImagePlus size={28} style={{ margin: '0 auto .5rem', opacity: 0.4 ,color:"white"}} />
                    <p style={{ opacity: 0.6, fontSize: '.9rem',color:"white" }}>
                      Glissez des photos ici ou <strong>cliquez pour choisir</strong>
                    </p>
                    <input ref={fileRef} type="file" accept="image/*" multiple
                      style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
                  </div>
                )}
                {errors.images && (
                  <span className="form-error" style={{ display: 'block', marginTop: '.5rem' }}>
                    {errors.images}
                  </span>
                )}
                {previews.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                    {previews.map((src, i) => (
                      <div key={src} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1' }}>
                        <img src={src} alt={`preview-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => removeImage(i)} style={{
                          position: 'absolute', top: 4, right: 4,
                          background: 'rgba(0,0,0,.55)', border: 'none', borderRadius: '50%',
                          width: 22, height: 22, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', cursor: 'pointer', color: '#fff',
                        }}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side */}
          <div className="create-product-side" >
            <div className="card anim-fade-up anim-d2" style={{background:"#18203A"}}>
              <div className="card-header"><h2 className="card-title"  style={{color:"white"}}>Prix & Stock</h2></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Prix (TND) *</label>
                  <div className="input-prefix-wrap">
                    <span className="input-prefix">TND</span>
                    <input name="price" type="number" min={0} style={{color:"white"}} value={form.price} onChange={handle}
                      className={`form-input${errors.price ? ' input-error' : ''}`} placeholder="0.00" />
                  </div>
                  {errors.price && <span className="form-error">{errors.price}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Prix promotionnel (TND)</label>
                  <input name="solde" type="number" style={{color:"white"}} min={0} value={form.solde} onChange={handle}
                    className="form-input" placeholder="Laisser vide si pas de promotion" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Stock disponible</label>
                  <input name="stock" type="number" style={{color:"white"}} min={0} value={form.stock} onChange={handle}
                    className="form-input" placeholder="Quantité" />
                </div>
              </div>
            </div>

            <div className="card anim-fade-up anim-d2" style={{background:"#18203A"}}>
              <div className="card-header"><h2 className="card-title"  style={{color:"white"}}>Détails du produit</h2></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Région / Lieu</label>
                  <input name="location" type="text" style={{color:"white"}} value={form.location} onChange={handle}
                    className="form-input" placeholder="Ex: Tunis, Nabeul, Djerba" />
                </div>
                <div className="form-group">
                  <label className="form-label">Matière</label>
                  <input name="material" type="text" style={{color:"white"}} value={form.material} onChange={handle}
                    className="form-input" placeholder="Ex: Céramique, Laine, Cuir" />
                </div>
                <div className="form-group">
                  <label className="form-label">Dimensions</label>
                  <input name="dimensions" type="text" style={{color:"white"}} value={form.dimensions} onChange={handle}
                    className="form-input" placeholder="Ex: 30x40cm, L, XL" />
                </div>
                <div className="form-group">
                  <label className="form-label">Couleurs (séparées par des virgules)</label>
                  <input name="colors" type="text" style={{color:"white"}} value={form.colors} onChange={handle}
                    className="form-input" placeholder="Ex: Rouge, Bleu, Blanc" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tags (séparés par des virgules)</label>
                  <input name="tags" type="text" style={{color:"white"}} value={form.tags} onChange={handle}
                    className="form-input" placeholder="Ex: Traditionnel, Artisanal, Fait main" />
                </div>
              </div>
            </div>

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

            <div className="anim-fade-up anim-d4">
              <button type="submit" className="publish-btn" disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : '✦'}
                {submitting ? 'Publication…' : 'Publier le produit'}
              </button>

            </div>
          </div>
        </div>
      </form>
      <style>{`
        .input-error { border-color: #E53E3E !important; }
        .form-error  { display: block; margin-top: 4px; font-size: 0.78rem; color: #E53E3E; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Toast ── */
        .app-toast {
          position: fixed;
          left: calc(50% + 100px);           /* centred on the content area (sidebar ≈ 200px) */
          bottom: 32px;
          transform: translateX(-50%);
          z-index: 999999;
          display: flex; align-items: center; gap: 12px;
          min-width: 280px; max-width: min(92vw, 460px);
          padding: 14px 20px;
          border-radius: 14px;
          color: #fff; font-size: 0.95rem; font-weight: 600;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.14);
          box-shadow: 0 14px 36px rgba(0,0,0,.5);
          animation: toastIn .25s ease-out;
        }
        .app-toast-error   { background: linear-gradient(135deg, #7f1d1d, #b91c1c); }
        .app-toast-success { background: linear-gradient(135deg, #14532d, #15803d); }
        .app-toast-icon {
          width: 26px; height: 26px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%; background: rgba(255,255,255,.2);
          font-weight: 800; font-size: .9rem;
        }
        .app-toast-msg { line-height: 1.3; }
        .app-toast-bar {
          position: absolute; left: 0; bottom: 0;
          height: 3px; width: 100%;
          background: rgba(255,255,255,.6);
          transform-origin: left;
          animation: toastBar 2s linear forwards;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, 16px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes toastBar { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        @media (max-width: 900px) {
          .app-toast { left: 50%; bottom: 20px; }
        }
      `}</style>
    </div>
  );
}