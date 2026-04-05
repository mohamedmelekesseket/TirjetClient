'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem { label: string; href: string; icon: string; }

const artisanNav: NavItem[] = [
  { label: 'Tableau de bord', href: '/dashboard/artisan',          icon: '⬡' },
  { label: 'Mes Produits',    href: '/dashboard/artisan/products', icon: '◈' },
  { label: 'Commandes',       href: '/dashboard/artisan/orders',   icon: '◉' },
  { label: 'Mon Profil',      href: '/dashboard/artisan/profile',  icon: '◎' },
];

const adminNav: NavItem[] = [
  { label: 'Tableau de bord', href: '/dashboard/admin',           icon: '⬡' },
  { label: 'Artisans',        href: '/dashboard/admin/artisans',  icon: '◈' },
  { label: 'Produits',        href: '/dashboard/admin/products',  icon: '◉' },
  { label: 'Utilisateurs',    href: '/dashboard/admin/users',     icon: '◎' },
  { label: 'Statistiques',    href: '/dashboard/admin/stats',     icon: '◇' },
];

export default function Sidebar({ role }: { role: 'artisan' | 'admin' }) {
  const pathname = usePathname();
  const nav = role === 'artisan' ? artisanNav : adminNav;

  return (
    <aside className="sidebar">
      <div className="sidebar-bg" />
      <div className="sidebar-glow" />

      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">✦</div>
        <div>
          <div className="sidebar-brand-name">Artisana</div>
          <div className="sidebar-brand-role">{role === 'artisan' ? 'Artisan' : 'Admin'}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-section">Navigation</div>
        {nav.map((item, i) => {
          const isActive =
            pathname === item.href ||
            (item.href !== `/dashboard/${role}` && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item${isActive ? ' active' : ''} anim-d${Math.min(i + 1, 8)}`}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
              {isActive && <span className="sidebar-nav-indicator" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-card">
          <div className="sidebar-footer-icon">✦</div>
          <div>
            <div className="sidebar-footer-title">Artisana v2.0</div>
            <div className="sidebar-footer-sub">Plateforme artisanale</div>
          </div>
        </div>
        <button className="sidebar-logout">
          <span>⇠</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
