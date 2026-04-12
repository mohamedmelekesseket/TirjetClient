'use client';
import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import UploadImage from '@/app/dashboard/components/UploadImage';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Subcategory { _id: string; name: string; slug: string; }
interface Category { _id: string; name: string; subcategories: Subcategory[]; isActive: boolean; }

interface FormState {
  title: string;
  categoryId: string;
  subcategorySlug: string;
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
    title: '', categoryId: '', subcategorySlug: '', price: '', stock: '', description: '',
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
          title:           p.title       ?? '',
          categoryId:      p.category?._id ?? p.category ?? '',
          subcategorySlug: p.subcategory?.slug ?? '',
          price:           String(p.price ?? ''),
          stock:           String(p.stock ?? ''),
          description:     p.description ?? '',
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

  const selectedCategory = categories.find(c => c._id === form.categoryId);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: value,
      ...(name === 'categoryId' ? { subcategorySlug: '' } : {}),
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      const res = await fetch(`${API}/api/products/${id}`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:           form.title,
          category:        form.categoryId,
          subcategorySlug: form.subcategorySlug,
          price:           Number(form.price),
          stock:           Number(form.stock),
          description:     form.description,
          images,
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

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Catégorie *</label>
                  <select name="categoryId" value={form.categoryId} onChange={handle} className="form-select">
                    <option value="">Sélectionner...</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Sous-catégorie</label>
                  <select name="subcategorySlug" value={form.subcategorySlug} onChange={handle}
                    className="form-select"
                    disabled={!selectedCategory || selectedCategory.subcategories.length === 0}>
                    <option value="">Toutes</option>
                    {selectedCategory?.subcategories.map(s => (
                      <option key={s._id} value={s.slug}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

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