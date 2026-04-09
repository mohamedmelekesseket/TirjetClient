export default function Privacy() {
  return (
    <div className="privacy-page">
      <div className="privacy-container">

        {/* Badge */}
        <div className="privacy-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Politique de confidentialité
        </div>

        {/* Title */}
        <h1 className="privacy-title">Vos données,<br />notre responsabilité</h1>
        <p className="privacy-subtitle">Dernière mise à jour : avril 2026</p>
        <div className="privacy-divider" />

        {/* Card 1 — Data collected */}
        <div className="privacy-card">
          <div className="privacy-card-header">
            <div className="privacy-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2 className="privacy-card-title">Données collectées</h2>
          </div>
          <p className="privacy-card-text">
            Tirjet collecte uniquement votre <strong>nom</strong> et votre <strong>adresse e-mail</strong> lors de la connexion via Google ou Facebook. Ces informations sont utilisées exclusivement pour créer et gérer votre compte sur notre plateforme.
          </p>
        </div>

        {/* Card 2 — Data usage */}
        <div className="privacy-card">
          <div className="privacy-card-header">
            <div className="privacy-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l3 3" />
              </svg>
            </div>
            <h2 className="privacy-card-title">Utilisation des données</h2>
          </div>
          <p className="privacy-card-text">
            Vos données sont utilisées uniquement pour vous permettre d'accéder à votre compte, gérer vos favoris et interagir avec notre marketplace. <strong>Vos données ne sont jamais partagées, vendues ou transmises à des tiers.</strong>
          </p>
        </div>

        {/* Card 3 — Security */}
        <div className="privacy-card">
          <div className="privacy-card-header">
            <div className="privacy-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="privacy-card-title">Sécurité</h2>
          </div>
          <p className="privacy-card-text">
            Nous utilisons <strong>NextAuth.js</strong> avec OAuth 2.0 (Google, Facebook) pour une authentification sécurisée. Aucun mot de passe n'est stocké directement sur nos serveurs pour les connexions sociales. Toutes les communications sont chiffrées via <strong>HTTPS</strong>.
          </p>
        </div>

        {/* Card 4 — Data deletion */}
        <div className="privacy-card">
          <div className="privacy-card-header">
            <div className="privacy-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            <h2 className="privacy-card-title">Suppression de vos données</h2>
          </div>
          <p className="privacy-card-text">
            Vous pouvez demander la suppression de votre compte et de toutes vos données à tout moment en nous contactant par e-mail. Nous traiterons votre demande dans un délai de <strong>30 jours</strong>.
          </p>
        </div>

        {/* Contact CTA */}
        {/* <div className="privacy-contact-card">
          <div className="privacy-contact-text">
            <h3>Une question sur vos données ?</h3>
            <p>Notre équipe vous répond dans les plus brefs délais.</p>
          </div>
          <a href="mailto:melekesseket4@gmail.com" className="privacy-contact-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Nous contacter
          </a>
        </div> */}

        <p className="privacy-footer-note">
          © {new Date().getFullYear()} tamaguit — Atelier & Boutique. Tous droits réservés.
        </p>

      </div>
    </div>
  );
}