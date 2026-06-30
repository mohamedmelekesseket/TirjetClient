'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Bell, Menu, Search, X, Check } from 'lucide-react';
import { useApiToken } from '@/lib/useApiToken';

type Role = 'artisan' | 'admin';

interface NavItem {
  label: string;
  href: string;
  icon: string;
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
  { label: 'Tableau de bord', href: '/dashboard/artisan', icon: '◉' },
  { label: 'Mes Produits', href: '/dashboard/artisan/products', icon: '◉' },
  { label: 'Commandes', href: '/dashboard/artisan/orders', icon: '◉' },
  { label: 'Mon Profil', href: '/dashboard/artisan/profile', icon: '◉' },
];

const adminNav: NavItem[] = [
  { label: 'Tableau de bord', href: '/dashboard/admin',           icon: '◉' },
  { label: 'Artisans',        href: '/dashboard/admin/artisans',  icon: '◉' },
  { label: 'formationFromulaire',        href: '/dashboard/admin/formationFromulaire',  icon: '◉' },
  { label: 'Produits',        href: '/dashboard/admin/products',  icon: '◉' },
  { label: 'Orders',    href: '/dashboard/admin/orders',     icon: '◉' },
  { label: 'categories',        href: '/dashboard/admin/categories ',  icon: '◉' },
  { label: 'Utilisateurs',    href: '/dashboard/admin/users',     icon: '◉' },
  { label: 'Statistiques',    href: '/dashboard/admin/stats',     icon: '◉' },
  { label: "Maisons d'Hôtes",    href: '/dashboard/admin/maisonsdhotes',     icon: '◉' },
  { label: "Culture Amazigh",    href: '/dashboard/admin/cultureamazigh',     icon: '◉' },
  { label: 'Excursions',    href: '/dashboard/admin/excursions',     icon: '◉' },
];

export default function Navbar({ title, role }: { title: string; role: Role }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { apiToken } = useApiToken();

  const nav = useMemo(() => (role === 'artisan' ? artisanNav : adminNav), [role]);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
