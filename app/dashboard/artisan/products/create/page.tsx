'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  stock: string;
  description: string;
}

interface FieldError {
  title?: string;
  categoryId?: string;
  price?: string;
  description?: string;
}

function validate(form: FormState): FieldError {
  const errors: FieldError = {};
  if (!form.title.trim())       errors.title      = 'Le nom est requis.';
  if (!form.categoryId)         errors.categoryId = 'La catégorie est requise.';
  if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
                                errors.price      = 'Prix invalide.';
  if (!form.description.trim()) errors.description = 'La description est requise.';
  return errors;
}

export default function CreateProductPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>({
    title: '', categoryId: '',
    subcategoryL2Slug: '', subcategoryL3Slug: '', subcategoryL4Slug: '',
    price: '', stock: '', description: '',
  });
  const [images, setImages]         = useState<File[]>([]);
  const [previews, setPreviews]     = useState<string[]>([]);
  const [errors, setErrors]         = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const submit = async () => {
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }
    try {
      setSubmitting(true);
      setServerError(null);
      const body = new FormData();
      body.append('title',       form.title.trim());
      body.append('category',    form.categoryId);
      body.append('price',       form.price);
      body.append('stock',       form.stock || '1');
      body.append('description', form.description.trim());

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
      router.push('/dashboard/artisan/products');
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <Link href="/dashboard/artisan/products" className="page-back">← Retour aux produits</Link>
          <h1 className="page-title">Nouveau Produit</h1>
          <p className="page-subtitle">Ajoutez un produit à votre catalogue artisanal</p>
        </div>
      </div>

      {serverError && (
        <div className="card anim-fade-up" style={{ marginBottom: '1rem', color: '#e53e3e', padding: '1rem' }}>
          {serverError}
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); submit(); }} noValidate>
        <div className="create-product-grid">
          <div className="create-product-main">

            {/* General info */}
            <div className="card anim-fade-up anim-d1">
              <div className="card-header"><h2 className="card-title">Informations générales</h2></div>
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
                    name="categoryId" value={form.categoryId} onChange={handle}
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
                      name="subcategoryL2Slug" value={form.subcategoryL2Slug} onChange={handle}
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
                      name="subcategoryL3Slug" value={form.subcategoryL3Slug} onChange={handle}
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
                      name="subcategoryL4Slug" value={form.subcategoryL4Slug} onChange={handle}
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
                    name="description" value={form.description} onChange={handle}
                    className={`form-textarea${errors.description ? ' input-error' : ''}`}
                    rows={5}
                    placeholder="Décrivez votre produit, son histoire, ses matériaux..."
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
                {images.length < 8 && (
                  <div
                    onDragOver={e => e.preventDefault()} onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
                    style={{
                      border: '2px dashed var(--color-border,#e2e8f0)', borderRadius: 12,
                      padding: '2rem', textAlign: 'center', cursor: 'pointer',
                      marginBottom: previews.length ? '1rem' : 0,
                    }}
                  >
                    <ImagePlus size={28} style={{ margin: '0 auto .5rem', opacity: 0.4 }} />
                    <p style={{ opacity: 0.6, fontSize: '.9rem' }}>
                      Glissez des photos ici ou <strong>cliquez pour choisir</strong>
                    </p>
                    <input ref={fileRef} type="file" accept="image/*" multiple
                      style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
                  </div>
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
          <div className="create-product-side">
            <div className="card anim-fade-up anim-d2">
              <div className="card-header"><h2 className="card-title">Prix & Stock</h2></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Prix (TND) *</label>
                  <div className="input-prefix-wrap">
                    <span className="input-prefix">TND</span>
                    <input name="price" type="number" min={0} value={form.price} onChange={handle}
                      className={`form-input${errors.price ? ' input-error' : ''}`} placeholder="0.00" />
                  </div>
                  {errors.price && <span className="form-error">{errors.price}</span>}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Stock disponible</label>
                  <input name="stock" type="number" min={0} value={form.stock} onChange={handle}
                    className="form-input" placeholder="Quantité" />
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}