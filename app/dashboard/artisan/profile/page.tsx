'use client';
import { useState } from 'react';

export default function ProfilePage() {
  const [form, setForm] = useState({
    firstName: 'Ahmed',
    lastName: 'Benali',
    email: 'ahmed.benali@artisana.ma',
    phone: '+212 661 234 567',
    city: 'Marrakech',
    region: 'Souss-Massa',
    speciality: 'Poterie',
    bio: "Artisan potier avec 15 ans d'expérience, spécialisé dans les pièces berbères traditionnelles de la région d'Azilal. Chaque pièce est façonnée à la main avec des techniques transmises de génération en génération.",
    website: '',
    instagram: '@ahmed.poterie',
  });

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Mon Profil</h1>
          <p className="page-subtitle">Gérez vos informations personnelles et votre storytelling</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Left: profile card */}
        <div className="profile-card anim-fade-left">
          <div className="profile-cover" />
          <div style={{ padding: '0 20px' }}>
            <div className="profile-avatar-wrap">
              <div className="profile-avatar-large">A</div>
            </div>
            <div className="profile-info-center">
              <div className="profile-name-display">{form.firstName} {form.lastName}</div>
              <div className="profile-role-display">Artisan Certifié</div>
              <span className="badge badge-success">✓ Compte vérifié</span>
            </div>
          </div>

          <div className="profile-stats-row">
            {[{ num: '24', lbl: 'Produits' }, { num: '156', lbl: 'Commandes' }, { num: '4.8★', lbl: 'Note' }].map(s => (
              <div key={s.lbl} className="profile-stat-item">
                <div className="profile-stat-num">{s.num}</div>
                <div className="profile-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>

          {/* Specialities */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(2,52,171,0.07)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#8B9AB5', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>Spécialités</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Poterie', 'Céramique', 'Argile cuite', 'Art berbère'].map(tag => (
                <span key={tag} className="badge badge-primary">{tag}</span>
              ))}
            </div>
          </div>

          {/* Social */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(2,52,171,0.07)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#8B9AB5', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>Réseaux sociaux</div>
            <div style={{ fontSize: '0.85rem', color: '#0234AB', fontWeight: 500 }}>📷 {form.instagram}</div>
          </div>
        </div>

        {/* Right: form */}
        <div className="profile-form-card anim-fade-right">
          <div className="card-header">
            <h2 className="card-title">Informations personnelles</h2>
          </div>
          <div className="card-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Prénom</label>
                <input name="firstName" value={form.firstName} onChange={handle} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input name="lastName" value={form.lastName} onChange={handle} className="form-input" />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input name="email" type="email" value={form.email} onChange={handle} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input name="phone" value={form.phone} onChange={handle} className="form-input" />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Ville</label>
                <input name="city" value={form.city} onChange={handle} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Région</label>
                <select name="region" value={form.region} onChange={handle} className="form-select">
                  {['Souss-Massa', 'Marrakech-Safi', 'Fès-Meknès', 'Rabat-Salé', 'Casablanca-Settat'].map(r => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Spécialité principale</label>
              <select name="speciality" value={form.speciality} onChange={handle} className="form-select">
                {['Poterie', 'Maroquinerie', 'Textile', 'Métal', 'Bois', 'Bijoux'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ height: '1px', background: 'rgba(2,52,171,0.07)', margin: '20px 0' }} />
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 600, color: '#0A0F2C', marginBottom: '16px' }}>
              Mon histoire (Storytelling)
            </div>

            <div className="form-group">
              <label className="form-label">Biographie</label>
              <textarea name="bio" value={form.bio} onChange={handle} className="form-textarea" rows={6}
                placeholder="Partagez votre passion pour l'artisanat, votre parcours, vos techniques..." />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Site web</label>
                <input name="website" value={form.website} onChange={handle} className="form-input" placeholder="https://" />
              </div>
              <div className="form-group">
                <label className="form-label">Instagram</label>
                <input name="instagram" value={form.instagram} onChange={handle} className="form-input" placeholder="@votre_compte" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button className="btn btn-primary btn-lg">✦ Sauvegarder le profil</button>
              <button className="btn btn-secondary">Annuler</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
