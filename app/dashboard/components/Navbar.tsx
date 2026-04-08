import { Bell, Search } from "lucide-react";

export default function Navbar({ title, role }: { title: string; role: 'artisan' | 'admin' }) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-breadcrumb">
          <span className="navbar-breadcrumb-root">Artisana</span>
          <span className="navbar-breadcrumb-sep">›</span>
          <span className="navbar-breadcrumb-current">{title}</span>
        </div>

        <div className="navbar-right">
          <div className="navbar-search">
            <span className="navbar-search-icon" aria-hidden="true">
              <Search size={16} />
            </span>
            <input className="navbar-search-input" placeholder="Rechercher..." />
          </div>

          <button className="navbar-icon-btn" aria-label="Notifications">
            <Bell size={18} />
            <span className="navbar-notif-badge">3</span>
          </button>

          <div className="navbar-profile">
            <div className="navbar-avatar">
              {role === 'artisan' ? 'A' : 'AD'}
            </div>
            <div>
              <div className="navbar-profile-name">
                {role === 'artisan' ? 'Ahmed Benali' : 'Administrateur'}
              </div>
              <div className="navbar-profile-role">
                {role === 'artisan' ? 'Artisan certifié' : 'Super Admin'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
