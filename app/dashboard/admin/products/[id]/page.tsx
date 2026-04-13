'use client';
import { useEffect, useState, useCallback, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, ShieldCheck, ShieldOff, Home, Tag, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import UploadImage from '@/app/dashboard/components/UploadImage';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Subcategory { _id: string; name: string; slug: string; }
interface Category { _id: string; name: string; subcategories: Subcategory[]; isActive: boolean; }

interface FormState {
  title: string;
  categoryId: string;
  subcategorySlug: string;
  price: string;
  solde: string;
  stock: string;
  description: string;
}

interface AdminToggles {
  isApproved: boolean;
  isSuspended: boolean;
  isHome: boolean;
  isReported: boolean;
}

export default function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>({
    title: '', categoryId: '', subcategorySlug: '',
    price: '', solde: '', stock: '', description: '',
  });
  const [toggles, setToggles] = useState<AdminToggles>({
    isApproved: true, isSuspended: false, isHome: false, isReported: false,
  });

  // ── Images: state for rendering + ref for always-fresh reads in callbacks ──
  const [images, _setImages] = useState<string[]>([]);
  const imagesRef = useRef<string[]>([]);

  // Always update both state and ref together
  const setImages = useCallback((updater: string[] | ((prev: string[]) => string[])) => {
    _setImages(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      imagesRef.current = next;
      return next;
    });
  }, []);

  const [uploading, setUploading] = useState(false);
  const [artisan, setArtisan]     = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [saveError, setSaveError]     = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
          title:           p.title              ?? '',
          categoryId:      p.category?._id ?? p.category ?? '',
          subcategorySlug: p.subcategory?.slug  ?? '',
          price:           String(p.price       ?? ''),
          solde:           String(p.solde       ?? ''),
          stock:           String(p.stock       ?? ''),
          description:     p.description        ?? '',
        });
        setToggles({
          isApproved:  !!p.isApproved,
          isSuspended: !!p.isSuspended,
          isHome:      !!p.isHome,
          isReported:  !!p.isReported,
        });
        setImages(p.images ?? []);
        if (p.artisan) setArtisan({ name: p.artisan.name, email: p.artisan.email });
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

  const toggle = (key: keyof AdminToggles) => {
    setToggles(t => {
      const next = { ...t, [key]: !t[key] };
      if (key === 'isSuspended' && next.isSuspended) next.isApproved = false;
      if (key === 'isApproved'  && next.isApproved)  next.isSuspended = false;
      return next;
    });
  };

  // Stable callback so UploadImage always gets the latest reference
  const handleUpload = useCallback((urls: string[]) => {
    setUploading(false);
    setImages(prev => [...prev, ...urls]);
  }, [setImages]);

  const handleRemoveImage = useCallback((idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  }, [setImages]);

  const handleSave = async () => {
    if (uploading) {
      setSaveError("Veuillez attendre la fin du téléchargement des images.");
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      // Read from ref — always has the latest value, no stale closure risk
      const cleanImages = imagesRef.current.filter(url => !url.startsWith('blob:'));

      const res = await fetch(`${API}/api/products/${id}`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:           form.title,
          category:        form.categoryId,
          subcategorySlug: form.subcategorySlug,
          price:           Number(form.price),
          solde:           form.solde ? Number(form.solde) : '',
          stock:           Number(form.stock),
          description:     form.description,
          images:          cleanImages,
          isApproved:      toggles.isApproved,
          isSuspended:     toggles.isSuspended,
          isHome:          toggles.isHome,
          isReported:      toggles.isReported,
        }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setSaveSuccess(true);
      setTimeout(() => router.push('/dashboard/admin/products'), 1200);
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div className="page-header anim-fade-up">
        <div>
          <Link href="/dashboard/admin/products" className="page-back">← Retour aux produits</Link>
          <h1 className="page-title">
            Modifier le Produit{' '}
            <span style={{ fontSize: '0.75em', color: '#8B9AB5', fontWeight: 400 }}>(Admin)</span>
          </h1>
          <p className="page-subtitle">
            {artisan
              ? <>Produit de <strong>{artisan.name}</strong> — {artisan.email}</>
              : 'Modifier toutes les informations du produit'}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {saveError && (
        <div style={{ color: '#e53e3e', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: '12px 16px', marginBottom: '1rem' }}>
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div style={{ color: '#0B9E5E', background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: 8, padding: '12px 16px', marginBottom: '1rem' }}>
          ✓ Produit mis à jour — redirection…
        </div>
      )}

      <div className="create-product-grid">
        <div className="create-product-main">

          {/* General info */}
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
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
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
                  className="form-textarea" rows={5} placeholder="Décrivez le produit…" />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="card anim-fade-up anim-d2">
            <div className="card-header">
              <h2 className="card-title">
                Photos du produit
                {uploading && (
                  <span style={{ fontSize: '0.75rem', color: '#8B9AB5', fontWeight: 400, marginLeft: 8 }}>
                    <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', display: 'inline', marginRight: 4 }} />
                    Upload en cours…
                  </span>
                )}
              </h2>
            </div>
            <div className="card-body">
              {images.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  {images.map((src, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={src} alt={`photo-${i}`}
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid #e2e8f0' }} />
                      <button onClick={() => handleRemoveImage(i)}
                        style={{ position: 'absolute', top: -6, right: -6, background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12, lineHeight: '20px' }}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <UploadImage
                multiple
                onUploadStart={() => setUploading(true)}
                onUpload={handleUpload}
              />
            </div>
          </div>

          {/* Admin toggles */}
          <div className="card anim-fade-up anim-d3" style={{ border: '1.5px solid #e9d8fd' }}>
            <div className="card-header" style={{ background: 'linear-gradient(90deg,#faf5ff,#fff)' }}>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} style={{ color: '#805ad5' }} /> Contrôles Admin
              </h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <ToggleRow icon={<ShieldCheck size={16} />} label="Approuvé"       description="Visible sur la plateforme"  active={toggles.isApproved}  activeColor="#0B9E5E" onClick={() => toggle('isApproved')} />
                <ToggleRow icon={<ShieldOff size={16} />}   label="Suspendu"       description="Masqué & non approuvé"      active={toggles.isSuspended} activeColor="#e53e3e" onClick={() => toggle('isSuspended')} />
                <ToggleRow icon={<Home size={16} />}         label="Page d'accueil" description="Mis en avant sur le site"   active={toggles.isHome}      activeColor="#0234AB" onClick={() => toggle('isHome')} />
                <ToggleRow icon={<AlertTriangle size={16} />} label="Signalé"      description="Marqué comme signalé"       active={toggles.isReported}  activeColor="#F59E0B" onClick={() => toggle('isReported')} />
              </div>
              {toggles.isSuspended && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, fontSize: '0.82rem', color: '#c53030', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <AlertTriangle size={14} /> Ce produit sera suspendu et retiré de la plateforme.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Sidebar */}
        <div className="create-product-side">

          {/* Price & Stock */}
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

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag size={13} /> Prix soldé (%)
                  <span style={{ fontSize: '0.75rem', color: '#8B9AB5', fontWeight: 400 }}>optionnel</span>
                </label>
                <div className="input-prefix-wrap">
                  <span className="input-prefix" style={{ color: '#e53e3e' }}>%</span>
                  <input name="solde" type="number" min={0} value={form.solde} onChange={handle}
                    className="form-input" placeholder="Ex: 45" />
                </div>
                {form.solde && Number(form.solde) > 0 && Number(form.price) > 0 && (
                  <p style={{ fontSize: '0.78rem', color: '#0B9E5E', marginTop: 4 }}>
                    Prix après solde : <strong>{(Number(form.price) * (1 - Number(form.solde) / 100)).toFixed(2)} TND</strong>
                  </p>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Stock</label>
                <input name="stock" type="number" min={0} value={form.stock} onChange={handle} className="form-input" />
              </div>
            </div>
          </div>

          {/* Status summary */}
          <div className="card anim-fade-up anim-d3" style={{ border: '1px solid #e2e8f0' }}>
            <div className="card-header"><h2 className="card-title">Statut actuel</h2></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <StatusLine label="Approbation" value={toggles.isApproved  ? 'Approuvé'    : 'Non approuvé'} color={toggles.isApproved  ? '#0B9E5E' : '#F59E0B'} />
              <StatusLine label="Suspension"  value={toggles.isSuspended ? 'Suspendu'    : 'Actif'}        color={toggles.isSuspended ? '#e53e3e' : '#0B9E5E'} />
              <StatusLine label="Accueil"     value={toggles.isHome      ? 'En vedette'  : 'Standard'}     color={toggles.isHome      ? '#0234AB' : '#8B9AB5'} />
              <StatusLine label="Signalement" value={toggles.isReported  ? 'Signalé'     : 'Normal'}       color={toggles.isReported  ? '#F59E0B' : '#8B9AB5'} />
            </div>
          </div>

          {/* Actions */}
          <div className="anim-fade-up anim-d4">
            <button
              className="publish-btn"
              onClick={handleSave}
              disabled={saving || uploading}
              style={{ opacity: (saving || uploading) ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
            >
              {uploading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Upload en cours…</>
                : saving
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sauvegarde…</>
                : '✦ Sauvegarder les modifications'}
            </button>
            <button className="draft-btn" onClick={() => router.back()} disabled={saving || uploading}>
              Annuler les changements
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Small helper components ──────────────────────────────────────

function ToggleRow({ icon, label, description, active, activeColor, onClick }: {
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  activeColor: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
      border: `1.5px solid ${active ? activeColor + '40' : '#e2e8f0'}`,
      background: active ? activeColor + '08' : '#fafafa',
      textAlign: 'left', transition: 'all 0.18s', width: '100%',
    }}>
      <span style={{ color: active ? activeColor : '#A0AEC0', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: active ? activeColor : '#2D3748' }}>{label}</div>
        <div style={{ fontSize: '0.72rem', color: '#8B9AB5', marginTop: 1 }}>{description}</div>
      </div>
      {active
        ? <ToggleRight size={20} style={{ color: activeColor, flexShrink: 0 }} />
        : <ToggleLeft  size={20} style={{ color: '#CBD5E0',  flexShrink: 0 }} />}
    </button>
  );
}

function StatusLine({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
      <span style={{ color: '#8B9AB5' }}>{label}</span>
      <span style={{ fontWeight: 600, color }}>{value}</span>
    </div>
  );
}