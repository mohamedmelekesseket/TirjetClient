'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, X, ImagePlus, Search, UserCheck } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Subcategory { _id: string; name: string; slug: string; }
interface Category    { _id: string; name: string; subcategories: Subcategory[]; isActive: boolean; }
interface Vendor      { _id: string; name: string; email: string; image?: string; }

interface FormState {
  title: string;
  categoryId: string;
  subcategorySlug: string;
  price: string;
  stock: string;
  description: string;
}

interface FieldError {
  title?: string;
  categoryId?: string;
  price?: string;
  description?: string;
  vendor?: string;
}

function validate(form: FormState, vendorId: string): FieldError {
  const errors: FieldError = {};
  if (!form.title.trim())       errors.title       = 'Le nom est requis.';
  if (!form.categoryId)         errors.categoryId  = 'La catégorie est requise.';
  if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
                                errors.price       = 'Prix invalide.';
  if (!form.description.trim()) errors.description = 'La description est requise.';
  if (!vendorId)                errors.vendor      = 'Veuillez sélectionner un artisan.';
  return errors;
}

export default function AdminCreateProductPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  // ── Categories ──────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);

  // ── Vendor search ────────────────────────────────────
  const [vendorEmail, setVendorEmail]     = useState('');
  const [vendorResults, setVendorResults] = useState<Vendor[]>([]);
  const [vendorSearching, setVendorSearching] = useState(false);
  const [selectedVendor, setSelectedVendor]   = useState<Vendor | null>(null);
  const vendorDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Form ─────────────────────────────────────────────
  const [form, setForm] = useState<FormState>({
    title: '', categoryId: '', subcategorySlug: '',
    price: '', stock: '', description: '',
  });
  const [images, setImages]           = useState<File[]>([]);
  const [previews, setPreviews]       = useState<string[]>([]);
  const [errors, setErrors]           = useState<FieldError>({});
  const [submitting, setSubmitting]   = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Load categories ──────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.data) setCategories(data.data.filter((c: Category) => c.isActive));
      })
      .catch(() => {});
  }, []);

  // ── Vendor search (debounced) ────────────────────────
  useEffect(() => {
    if (vendorDebounce.current) clearTimeout(vendorDebounce.current);
    if (!vendorEmail.trim()) { setVendorResults([]); return; }

    vendorDebounce.current = setTimeout(async () => {
      setVendorSearching(true);
      try {
        const res = await fetch(
          `${API}/api/users?role=vendor&search=${encodeURIComponent(vendorEmail)}&limit=6`,
          { headers: { Authorization: `Bearer ${apiToken}` } }
        );
        const data = await res.json();
        setVendorResults(data.users ?? []);
      } catch {
        setVendorResults([]);
      } finally {
        setVendorSearching(false);
      }
    }, 350);
  }, [vendorEmail, apiToken]);

  const pickVendor = (v: Vendor) => {
    setSelectedVendor(v);
    setVendorEmail(v.email);
    setVendorResults([]);
    setErrors(prev => ({ ...prev, vendor: undefined }));
  };

  const clearVendor = () => {
    setSelectedVendor(null);
    setVendorEmail('');
    setVendorResults([]);
  };

  // ── Helpers ──────────────────────────────────────────
  const selectedCategory = categories.find(c => c._id === form.categoryId);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: value,
      ...(name === 'categoryId' ? { subcategorySlug: '' } : {}),
    }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles    = Array.from(files).slice(0, 8 - images.length);
    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    setImages(prev   => [...prev, ...newFiles]);
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

  // ── Submit ───────────────────────────────────────────
  const submit = async () => {
    const fieldErrors = validate(form, selectedVendor?._id ?? '');
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }

    try {
      setSubmitting(true);
      setServerError(null);

      const body = new FormData();
      body.append('title',           form.title.trim());
      body.append('category',        form.categoryId);
      body.append('subcategorySlug', form.subcategorySlug);
      body.append('price',           form.price);
      body.append('stock',           form.stock || '1');
      body.append('description',     form.description.trim());
      body.append('artisanId',       selectedVendor!._id);
      images.forEach(img => body.append('images', img));

      const res = await fetch(`${API}/api/products/admin/for-vendor`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiToken}` },
        body,
      });

      if (res.status === 401) throw new Error('Non autorisé — session expirée ?');
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message ?? `Erreur ${res.status}`);
      }
      router.push('/dashboard/admin/products');
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── UI ───────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="page-header anim-fade-up">
        <div>
          <Link href="/dashboard/admin/products" className="page-back">
            ← Retour aux produits
          </Link>
          <h1 className="page-title">Nouveau Produit</h1>
          <p className="page-subtitle">Créez un produit au nom d'un artisan</p>
        </div>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="card anim-fade-up"
          style={{ marginBottom: '1rem', color: '#e53e3e', padding: '1rem' }}>
          {serverError}
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); submit(); }} noValidate>
        <div className="create-product-grid">

          {/* ══ LEFT — main fields (identical to artisan page) ══ */}
          <div className="create-product-main">

            {/* General info */}
            <div className="card anim-fade-up anim-d1">
              <div className="card-header">
                <h2 className="card-title">Informations générales</h2>
              </div>
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

                <div className="form-grid-2">
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

                  <div className="form-group">
                    <label className="form-label">Sous-catégorie</label>
                    <select
                      name="subcategorySlug" value={form.subcategorySlug} onChange={handle}
                      className="form-select"
                      disabled={!selectedCategory || selectedCategory.subcategories.length === 0}
                    >
                      <option value="">Toutes</option>
                      {selectedCategory?.subcategories.map(s => (
                        <option key={s._id} value={s.slug}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea
                    name="description" value={form.description} onChange={handle}
                    className={`form-textarea${errors.description ? ' input-error' : ''}`}
                    rows={5}
                    placeholder="Décrivez le produit, son histoire, ses matériaux..."
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
                      border: '2px dashed rgba(2,52,171,0.2)',
                      borderRadius: 12, padding: '2rem',
                      textAlign: 'center', cursor: 'pointer',
                      marginBottom: previews.length ? '1rem' : 0,
                      background: 'rgba(238,242,255,0.5)',
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                  >
                    <ImagePlus size={28} style={{ margin: '0 auto .5rem', opacity: 0.4 }} />
                    <p style={{ opacity: 0.6, fontSize: '.9rem' }}>
                      Glissez des photos ici ou <strong>cliquez pour choisir</strong>
                    </p>
                    <input ref={fileRef} type="file" accept="image/*" multiple
                      style={{ display: 'none' }}
                      onChange={e => handleFiles(e.target.files)} />
                  </div>
                )}
                {previews.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: 10,
                  }}>
                    {previews.map((src, i) => (
                      <div key={src} style={{
                        position: 'relative', borderRadius: 8,
                        overflow: 'hidden', aspectRatio: '1',
                      }}>
                        <img src={src} alt={`preview-${i}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => removeImage(i)} style={{
                          position: 'absolute', top: 4, right: 4,
                          background: 'rgba(0,0,0,.55)', border: 'none',
                          borderRadius: '50%', width: 22, height: 22,
                          display: 'flex', alignItems: 'center',
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

          {/* ══ RIGHT — side panel ══ */}
          <div className="create-product-side">

            {/* ── Vendor search card (new, admin-only) ── */}
            <div className="card anim-fade-up anim-d1">
              <div className="card-header">
                <h2 className="card-title">Artisan *</h2>
                {selectedVendor && (
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                    Sélectionné
                  </span>
                )}
              </div>
              <div className="card-body">

                {/* Search input */}
                <div className="form-group" style={{ marginBottom: vendorResults.length ? 8 : 0, position: 'relative' }}>
                  <label className="form-label">Rechercher par email</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={15} style={{
                      position: 'absolute', left: 12,
                      color: '#8B9AB5', pointerEvents: 'none',
                    }} />
                    <input
                      type="email"
                      value={vendorEmail}
                      onChange={e => {
                        setVendorEmail(e.target.value);
                        if (selectedVendor) setSelectedVendor(null);
                        setErrors(prev => ({ ...prev, vendor: undefined }));
                      }}
                      className={`form-input${errors.vendor ? ' input-error' : ''}`}
                      style={{ paddingLeft: 36, paddingRight: selectedVendor ? 36 : 12 }}
                      placeholder="artisan@email.com"
                      autoComplete="off"
                    />
                    {vendorSearching && (
                      <Loader2 size={14} style={{
                        position: 'absolute', right: 12,
                        color: '#8B9AB5', animation: 'spin 1s linear infinite',
                      }} />
                    )}
                    {selectedVendor && !vendorSearching && (
                      <button type="button" onClick={clearVendor} style={{
                        position: 'absolute', right: 10,
                        background: 'none', border: 'none',
                        cursor: 'pointer', color: '#8B9AB5', padding: 0,
                        display: 'flex', alignItems: 'center',
                      }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {errors.vendor && <span className="form-error">{errors.vendor}</span>}
                </div>

                {/* Dropdown results */}
                {vendorResults.length > 0 && (
                  <div style={{
                    border: '1.5px solid rgba(2,52,171,0.12)',
                    borderRadius: 10, overflow: 'hidden',
                    marginBottom: 4,
                  }}>
                    {vendorResults.map(v => (
                      <button
                        key={v._id}
                        type="button"
                        onClick={() => pickVendor(v)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          width: '100%', padding: '9px 12px',
                          background: 'white', border: 'none',
                          borderBottom: '1px solid rgba(2,52,171,0.06)',
                          cursor: 'pointer', textAlign: 'left',
                          transition: 'background 0.15s',
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFF')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                          background: v.image ? 'transparent' : 'linear-gradient(135deg,#0234AB,#1a4fd4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden', color: '#fff',
                          fontSize: '0.85rem', fontWeight: 700,
                        }}>
                          {v.image
                            ? <img src={v.image} alt={v.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : v.name[0].toUpperCase()
                          }
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0A0F2C',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {v.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#8B9AB5',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {v.email}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected vendor chip */}
                {selectedVendor && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(11,158,94,0.07)',
                    border: '1.5px solid rgba(11,158,94,0.22)',
                    marginTop: 4,
                  }}>
                    <UserCheck size={16} style={{ color: '#0B9E5E', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0A0F2C' }}>
                        {selectedVendor.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#8B9AB5' }}>
                        {selectedVendor.email}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price & Stock — identical to artisan page */}
            <div className="card anim-fade-up anim-d2">
              <div className="card-header"><h2 className="card-title">Prix & Stock</h2></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Prix (TND) *</label>
                  <div className="input-prefix-wrap">
                    <span className="input-prefix">TND</span>
                    <input name="price" type="number" min={0} value={form.price} onChange={handle}
                      className={`form-input${errors.price ? ' input-error' : ''}`}
                      placeholder="0.00" />
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

            {/* Tips — identical to artisan page */}
            <div className="tips-card anim-fade-up anim-d3">
              <div className="tips-card-icon">✦</div>
              <div className="tips-card-title">Conseils vendeur</div>
              <ul className="tips-card-list">
                <li>Photos de haute qualité</li>
                <li>Décrivez les matériaux</li>
                <li>Mentionnez la technique</li>
                <li>Partagez son histoire</li>
              </ul>
            </div>

            {/* Submit — identical to artisan page */}
            <div className="anim-fade-up anim-d4">
              <button type="submit" className="publish-btn" disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {submitting
                  ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  : '✦'}
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
      `}</style>
    </div>
  );
}