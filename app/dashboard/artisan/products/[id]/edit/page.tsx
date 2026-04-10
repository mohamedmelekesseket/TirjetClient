'use client';
import { useEffect, useState, useCallback, use } from "react";
import axios from "axios";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import UploadImage from '@/app/dashboard/components/UploadImage';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const CATEGORIES = ['fokhar', 'margoum', 'tissage', 'bijoux', 'Bois', 'Métal'];

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // ← use() unwraps the Promise in a client component
  const router = useRouter();
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [form, setForm] = useState({
    title: '',
    category: '',
    price: '',
    stock: '',
    description: '',
  });
  const [images, setImages]       = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError]   = useState<string | null>(null);

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${apiToken}` }),
    [apiToken]
  );

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!apiToken) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const { data } = await axios.get(`${API}/api/products/${id}`, {
          headers: headers(),
        });

        setForm({
          title:       data.title       ?? '',
          category:    data.category    ?? '',
          price:       String(data.price  ?? ''),
          stock:       String(data.stock  ?? ''),
          description: data.description ?? '',
        });
        setImages(data.images ?? []);
      } catch (err: any) {
        setFetchError(err.response?.data?.message ?? err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, apiToken]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handle = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  interface Props {
    multiple?: boolean;
    onUpload: (urls: string[]) => void;  // ← this is missing
  }
  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      await axios.put(
        `${API}/api/products/${id}`,
        {
          title:       form.title,
          category:    form.category,
          price:       Number(form.price),
          stock:       Number(form.stock),
          description: form.description,
          images,
        },
        { headers: headers() }
      );
      router.push('/dashboard/artisan/products');
    } catch (err: any) {
      setSaveError(err.response?.data?.message ?? err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── States ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', opacity: 0.5 }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (fetchError) return (
    <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-error, #e53e3e)' }}>
      <p>{fetchError}</p>
      <button
        className="btn btn-primary"
        style={{ marginTop: '1rem' }}
        onClick={() => { setFetchError(null); setLoading(true); }}
      >
        Réessayer
      </button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="page-header anim-fade-up">
        <div>
          <Link href="/dashboard/artisan/products" className="page-back">
            ← Retour aux produits
          </Link>
          <h1 className="page-title">Modifier le Produit</h1>
          <p className="page-subtitle">Mettez à jour les informations de votre produit</p>
        </div>
      </div>

      {/* Save error banner */}
      {saveError && (
        <div style={{
          color: 'var(--color-error, #e53e3e)',
          background: '#fff5f5',
          border: '1px solid #fed7d7',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: '1rem',
        }}>
          {saveError}
        </div>
      )}

      <div className="create-product-grid">
        {/* ── Main column ── */}
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
                  name="title"
                  value={form.title}
                  onChange={handle}
                  className="form-input"
                  placeholder="Ex: Tajine en céramique berbère"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Catégorie</label>
                  <select name="category" value={form.category} onChange={handle} className="form-select">
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handle}
                  className="form-textarea"
                  rows={5}
                  placeholder="Décrivez votre produit..."
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="card anim-fade-up anim-d2">
            <div className="card-header">
              <h2 className="card-title">Photos du produit</h2>
            </div>
            <div className="card-body">
              {images.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {images.map((src, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img
                        src={src}
                        alt={`photo-${i}`}
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                      />
                      <button
                        onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                        style={{
                          position: 'absolute', top: -6, right: -6,
                          background: '#e53e3e', color: '#fff',
                          border: 'none', borderRadius: '50%',
                          width: 20, height: 20, cursor: 'pointer', fontSize: 12,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <UploadImage
                multiple
                onUpload={(urls: string[]) => setImages(prev => [...prev, ...urls])}
              />
            </div>
          </div>
        </div>

        {/* ── Side column ── */}
        <div className="create-product-side">
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
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Stock</label>
                <input
                  name="stock"
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={handle}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="anim-fade-up anim-d3">
            <button
              className="publish-btn"
              onClick={handleSave}
              disabled={saving}
              style={{
                opacity: saving ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'center',
              }}
            >
              {saving
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sauvegarde…</>
                : '✦ Sauvegarder les modifications'
              }
            </button>
            <button
              className="draft-btn"
              onClick={() => router.back()}
              disabled={saving}
            >
              Annuler les changements
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}