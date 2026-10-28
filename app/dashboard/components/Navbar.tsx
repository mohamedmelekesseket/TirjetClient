'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Menu,
  Search,
  X,
  LayoutDashboard,
  Package,
  ShoppingBag,
  User,
  Users,
  Tags,
  BarChart3,
  Home,
  Landmark,
  Compass,
  GraduationCap,
  Palette,
} from 'lucide-react';
import { useApiToken } from '@/lib/useApiToken';

type Role = 'artisan' | 'admin';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const artisanNav: NavItem[] = [
  { label: 'Tableau de bord', href: '/dashboard/artisan', icon: LayoutDashboard },
  { label: 'Mes Produits', href: '/dashboard/artisan/products', icon: Package },
  { label: 'Commandes', href: '/dashboard/artisan/orders', icon: ShoppingBag },
  { label: 'Mon Profil', href: '/dashboard/artisan/profile', icon: User },
];

const adminNav: NavItem[] = [
  { label: 'Tableau de bord', href: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Artisans', href: '/dashboard/admin/artisans', icon: Palette },
  { label: 'Formations', href: '/dashboard/admin/formationFromulaire', icon: GraduationCap },
  { label: 'Produits', href: '/dashboard/admin/products', icon: Package },
  { label: 'Commandes', href: '/dashboard/admin/orders', icon: ShoppingBag },
  { label: 'Catégories', href: '/dashboard/admin/categories', icon: Tags },
  { label: 'Utilisateurs', href: '/dashboard/admin/users', icon: Users },
  { label: 'Statistiques', href: '/dashboard/admin/stats', icon: BarChart3 },
  { label: "Maisons d'Hôtes", href: '/dashboard/admin/maisonsdhotes', icon: Home },
  { label: 'Culture Amazigh', href: '/dashboard/admin/cultureamazigh', icon: Landmark },
  { label: 'Excursions', href: '/dashboard/admin/excursions', icon: Compass },
];

export default function Navbar({ title, role }: { title: string; role: Role }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { apiToken } = useApiToken();

  const nav = useMemo(() => (role === 'artisan' ? artisanNav : adminNav), [role]);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!apiToken) return;

        const res = await fetch(`${API}/api/notifications`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('[Navbar] Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [API, apiToken]);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      if (!apiToken) return;

      await fetch(`${API}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${apiToken}` },
      });

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      if (!apiToken) return;

      await fetch(`${API}/api/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${apiToken}` },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "À l'instant";
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} j`;
    return date.toLocaleDateString('fr-FR');
  };

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock page scroll + close on Escape while the drawer is open
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileMenuOpen]);

  const displayName = role === 'artisan' ? 'Ahmed Benali' : 'Administrateur';
  const displayRole = role === 'artisan' ? 'Artisan certifié' : 'Super Admin';
  const avatarText = role === 'artisan' ? 'A' : 'AD';

  const mobileDrawer = (
    <>
      <div
        className="dash-mobile-backdrop"
        onClick={() => setMobileMenuOpen(false)}
      />
      <aside
        className="dash-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation dashboard"
      >
        <div className="dash-mobile-drawer-head">
          <div className="dash-mobile-brand">
            <span className="dash-mobile-brand-mark">T</span>
            <div>
              <div className="dash-mobile-brand-name">Tirjet</div>
              <div className="dash-mobile-brand-sub">
                {role === 'artisan' ? 'Espace Artisan' : 'Administration'}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="dash-mobile-close"
            aria-label="Fermer le menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="dash-mobile-nav">
          {nav.map((item) => {
            const Icon = item.icon;
            const root = `/dashboard/${role}`;
            const isActive =
              item.href === root
                ? pathname === root
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`dash-mobile-nav-link${isActive ? ' active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="dash-mobile-nav-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className="dash-mobile-nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="dash-mobile-drawer-foot">
          <div className="navbar-avatar">{avatarText}</div>
          <div>
            <div className="dash-mobile-user-name">{displayName}</div>
            <div className="dash-mobile-user-role">{displayRole}</div>
          </div>
        </div>
      </aside>
    </>
  );

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <button
            type="button"
            className="navbar-mobile-menu-btn"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="navbar-breadcrumb">
            <span className="navbar-breadcrumb-root">Tirjet</span>
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

          <div style={{ position: 'relative' }}>
            <button
              className="navbar-icon-btn"
              aria-label="Notifications"
              onClick={() => setNotificationOpen(!notificationOpen)}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="navbar-notif-badge">{unreadCount}</span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notificationOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                  onClick={() => setNotificationOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '320px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    maxHeight: '400px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2d6a4f',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '4px 8px',
                        }}
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div
                        style={{
                          padding: '32px',
                          textAlign: 'center',
                          color: '#9ca3af',
                        }}
                      >
                        Aucune notification
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => !notif.isRead && markAsRead(notif._id)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #f3f4f6',
                            cursor: 'pointer',
                            background: notif.isRead ? 'white' : '#f8fafc',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            if (!notif.isRead) {
                              e.currentTarget.style.background = '#f1f5f9';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!notif.isRead) {
                              e.currentTarget.style.background = '#f8fafc';
                            }
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '12px',
                            }}
                          >
                            {!notif.isRead && (
                              <div
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: '#2d6a4f',
                                  marginTop: '6px',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontSize: '14px',
                                  fontWeight: notif.isRead ? 400 : 600,
                                  color: '#1f2937',
                                  marginBottom: '4px',
                                }}
                              >
                                {notif.title}
                              </div>
                              <div
                                style={{
                                  fontSize: '13px',
                                  color: '#6b7280',
                                  marginBottom: '4px',
                                }}
                              >
                                {notif.message}
                              </div>
                              <div
                                style={{
                                  fontSize: '11px',
                                  color: '#9ca3af',
                                }}
                              >
                                {formatTimeAgo(notif.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="navbar-profile">
            <div className="navbar-avatar">{avatarText}</div>
            <div>
              <div className="navbar-profile-name">{displayName}</div>
              <div className="navbar-profile-role">{displayRole}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer: rendered in a portal so no parent transform/filter can trap it */}
      {mobileMenuOpen && typeof document !== 'undefined'
        ? createPortal(mobileDrawer, document.body)
        : null}
    </header>
  );
}