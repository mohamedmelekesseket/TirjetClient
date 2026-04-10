import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <Link href="/dashboard/artisan/products" className="page-back">← Retour aux produits</Link>
          <h1 className="page-title">Détail Produit #{params.id}</h1>
          <p className="page-subtitle">Consultez les informations complètes de ce produit</p>
        </div>
        <div className="header-actions-row">
          <Link href={`/dashboard/artisan/products/${params.id}/edit`} className="btn btn-primary">
            ✎ Modifier
          </Link>
          <button className="btn btn-danger">✕ Supprimer</button>
        </div>
      </div>

      <div className="create-product-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Product preview */}
          <div className="card anim-fade-up anim-d1">
            <div className="card-header">
              <h2 className="card-title">Aperçu du produit</h2>
              <span className="badge badge-success">Actif</span>
            </div>
            <div className="card-body">
              <div style={{ height: '200px', background: 'linear-gradient(135deg, #EEF2FF, #E0E9FF)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', marginBottom: '20px' }}>
                🏺
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#0234AB', marginBottom: '6px' }}>Poterie</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0A0F2C', marginBottom: '8px' }}>Tajine en céramique berbère</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '1.3rem', fontWeight: 700, color: '#0234AB', marginBottom: '16px' }}>350 TND</div>
              <p style={{ fontSize: '0.875rem', color: '#4A5568', lineHeight: 1.7 }}>
                Tajine artisanal en céramique, fabriqué à la main par des artisans berbères de la région d&apos;Azilal. 
                Chaque pièce est unique et porte les motifs traditionnels de l&apos;artisanat marocain authentique.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="card anim-fade-up anim-d2">
            <div className="card-header"><h2 className="card-title">Performance</h2></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', textAlign: 'center' }}>
                {[{ label: 'Commandes', val: '12', color: '#0234AB' }, { label: 'Vues', val: '234', color: '#8B5CF6' }, { label: 'Stock', val: '8', color: '#0B9E5E' }].map(s => (
                  <div key={s.label} style={{ padding: '16px', background: '#F8FAFF', borderRadius: '12px' }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: '0.72rem', color: '#8B9AB5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '4px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Side info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card anim-fade-up anim-d1">
            <div className="card-header"><h2 className="card-title">Informations</h2></div>
            <div className="card-body">
              {[
                { label: 'ID Produit', val: `#PRD-00${params.id}` },
                { label: 'Créé le', val: '15 Mars 2026' },
                { label: 'Modifié le', val: '01 Avr 2026' },
                { label: 'Catégorie', val: 'Poterie' },
                { label: 'Stock', val: '8 unités' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid rgba(2,52,171,0.05)' }}>
                  <span style={{ fontSize: '0.82rem', color: '#8B9AB5', fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0A0F2C' }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} className="anim-fade-up anim-d2">
            <Link href={`/dashboard/artisan/products/${params.id}/edit`} className="btn btn-primary" style={{ justifyContent: 'center' }}>✎ Modifier le produit</Link>
            <button className="btn btn-secondary">↗ Voir sur la vitrine</button>
            <button className="btn btn-danger">✕ Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
