'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Bell, Menu, Search, X } from 'lucide-react';

type Role = 'artisan' | 'admin';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const artisanNav: NavItem[] = [
  { label: 'Tableau de bord', href: '/dashboard/artisan', icon: '⬡' },
  { label: 'Mes Produits', href: '/dashboard/artisan/products', icon: '◈' },
  { label: 'Commandes', href: '/dashboard/artisan/orders', icon: '◉' },
  { label: 'Mon Profil', href: '/dashboard/artisan/profile', icon: '◎' },
];

const adminNav: NavItem[] = [
  { label: 'Tableau de bord', href: '/dashboard/admin', icon: '⬡' },
  { label: 'Artisans', href: '/dashboard/admin/artisans', icon: '◈' },
  { label: 'Produits', href: '/dashboard/admin/products', icon: '◉' },
  { label: 'Categories', href: '/dashboard/admin/categories', icon: '◇' },
  { label: 'Utilisateurs', href: '/dashboard/admin/users', icon: '◎' },
  { label: 'Statistiques', href: '/dashboard/admin/stats', icon: '◇' },
];

export default function Navbar({ title, role }: { title: string; role: Role }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const nav = useMemo(() => (role === 'artisan' ? artisanNav : adminNav), [role]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <button
            type="button"
            className="navbar-mobile-menu-btn"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(v => !v)}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="navbar-breadcrumb">
            <span className="navbar-breadcrumb-root">Artisana</span>
            <span className="navbar-breadcrumb-sep">›</span>
            <span className="navbar-breadcrumb-current">{title}</span>
          </div>
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

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <>
          <div className="dash-mobile-backdrop" onClick={() => setMobileMenuOpen(false)} />
          <div className="dash-mobile-drawer" role="dialog" aria-label="Navigation dashboard">
            <div className="dash-mobile-drawer-handle" />
            <div className="dash-mobile-drawer-title">
              Navigation — {role === 'artisan' ? 'Artisan' : 'Admin'}
            </div>
            <nav className="dash-mobile-nav">
              {nav.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== `/dashboard/${role}` && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`dash-mobile-nav-link${isActive ? ' active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="dash-mobile-nav-icon" aria-hidden="true">{item.icon}</span>
                    <span className="dash-mobile-nav-label">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
