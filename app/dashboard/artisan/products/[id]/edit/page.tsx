'use client';
import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import UploadImage from '@/app/dashboard/components/UploadImage';

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

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>({
    title: '', categoryId: '',
    subcategoryL2Slug: '', subcategoryL3Slug: '', subcategoryL4Slug: '',
    price: '', stock: '', description: '',
  });
  const [images, setImages]       = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError]   = useState<string | null>(null);

  const headers = useCallback(() => ({ Authorization: `Bearer ${apiToken}` }), [apiToken]);

  // fetch categories
  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.data) setCategories(data.data.filter((c: Category) => c.isActive)); })
      .catch(() => {});
  }, []);

  // fetch product
  useEffect(() => {
    if (!apiToken) return;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/products/${id}`, { headers: headers() });
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        const p = data.product ?? data.data ?? data;
        setForm({
          title:             p.title              ?? '',
          categoryId:        p.category?._id ?? p.category ?? '',
          subcategoryL2Slug: p.subcategoryL2?.slug ?? p.subcategory?.slug ?? '',
          subcategoryL3Slug: p.subcategoryL3?.slug ?? '',
          subcategoryL4Slug: p.subcategoryL4?.slug ?? '',
          price:             String(p.price ?? ''),
          stock:             String(p.stock ?? ''),
          description:       p.description ?? '',
        });
        setImages(p.images ?? []);
      } catch (err: any) {
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, apiToken]);

  // Derived subcategory lists
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
      if (name === 'categoryId')        { next.subcategoryL2Slug = ''; next.subcategoryL3Slug = ''; next.subcategoryL4Slug = ''; }
      if (name === 'subcategoryL2Slug') { next.subcategoryL3Slug = ''; next.subcategoryL4Slug = ''; }
      if (name === 'subcategoryL3Slug') { next.subcategoryL4Slug = ''; }
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);

      const l4 = l4List.find(s => s.slug === form.subcategoryL4Slug);

      const res = await fetch(`${API}/api/products/${id}`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:             form.title,
          category:          form.categoryId,
          price:             Number(form.price),
          stock:             Number(form.stock),
          description:       form.description,
          images,
          // Send slug + name for each level so the backend can store both
          subcategoryL2Slug: form.subcategoryL2Slug,
          subcategoryL2Name: selectedL2?.name ?? '',
          subcategoryL3Slug: form.subcategoryL3Slug,
          subcategoryL3Name: selectedL3?.name ?? '',
          subcategoryL4Slug: form.subcategoryL4Slug,
          subcategoryL4Name: l4?.name ?? '',
        }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      router.push('/dashboard/artisan/products');
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', opacity: 0.5 }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (fetchError) return (
    <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#e53e3e' }}>
      <p>{fetchError}</p>
    </div>
  );

  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <Link href="/dashboard/artisan/products" className="page-back">← Retour aux produits</Link>
          <h1 className="page-title">Modifier le Produit</h1>
          <p className="page-subtitle">Mettez à jour les informations de votre produit</p>
        </div>
      </div>

      {saveError && (
        <div style={{ color: '#e53e3e', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: '12px 16px', marginBottom: '1rem' }}>
          {saveError}
        </div>
      )}

      <div className="create-product-grid">
        <div className="create-product-main">

          <div className="card anim-fade-up anim-d1">
            <div className="card-header"><h2 className="card-title">Informations générales</h2></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Nom du produit *</label>
                <input name="title" value={form.title} onChange={handle}
                  className="form-input" placeholder="Ex: Tajine en céramique berbère" />
              </div>

              {/* L1 */}
              <div className="form-group">
                <label className="form-label">Catégorie *</label>
                <select name="categoryId" value={form.categoryId} onChange={handle} className="form-select">
                  <option value="">Sélectionner...</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* L2 */}
              {l2List.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Sous-catégorie</label>
                  <select name="subcategoryL2Slug" value={form.subcategoryL2Slug} onChange={handle} className="form-select">
                    <option value="">Toutes</option>
                    {l2List.map(s => <option key={s._id} value={s.slug}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {/* L3 */}
              {l3List.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Sous-catégorie (niveau 3)</label>
                  <select name="subcategoryL3Slug" value={form.subcategoryL3Slug} onChange={handle} className="form-select">
                    <option value="">Toutes</option>
                    {l3List.map(s => <option key={s._id} value={s.slug}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {/* L4 */}
              {l4List.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Sous-catégorie (niveau 4)</label>
                  <select name="subcategoryL4Slug" value={form.subcategoryL4Slug} onChange={handle} className="form-select">
                    <option value="">Toutes</option>
                    {l4List.map(s => <option key={s._id} value={s.slug}>{s.name}</option>)}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea name="description" value={form.description} onChange={handle}
                  className="form-textarea" rows={5} placeholder="Décrivez votre produit..." />
              </div>
            </div>
          </div>

          <div className="card anim-fade-up anim-d2">
            <div className="card-header"><h2 className="card-title">Photos du produit</h2></div>
            <div className="card-body">
              {images.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  {images.map((src, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={src} alt={`photo-${i}`}
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                      <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                        style={{ position: 'absolute', top: -6, right: -6, background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12 }}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <UploadImage multiple onUpload={(urls: string[]) => setImages(prev => [...prev, ...urls])} />
            </div>
          </div>
        </div>

        <div className="create-product-side">
          <div className="card anim-fade-up anim-d2">
            <div className="card-header"><h2 className="card-title">Prix & Stock</h2></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Prix (TND) *</label>
                <div className="input-prefix-wrap">
                  <span className="input-prefix">TND</span>
                  <input name="price" type="number" min={0} value={form.price} onChange={handle} className="form-input" />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Stock</label>
                <input name="stock" type="number" min={0} value={form.stock} onChange={handle} className="form-input" />
              </div>
            </div>
          </div>

          <div className="anim-fade-up anim-d3">
            <button className="publish-btn" onClick={handleSave} disabled={saving}
              style={{ opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              {saving
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sauvegarde…</>
                : '✦ Sauvegarder les modifications'}
            </button>
            <button className="draft-btn" onClick={() => router.back()} disabled={saving}>
              Annuler les changements
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}