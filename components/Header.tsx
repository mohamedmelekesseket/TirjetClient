"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Menu, User, LogOut, X, ShoppingBag, ChevronDown,ShieldUser , ChevronRight } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import logo from "../images/tirjet_app_icon (1).png";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/categories`;

interface Subcategory {
  _id: string;
  name: string;
  slug: string;
}

interface Category {
  _id: string;
  name: string;
  description: string;
  subcategories: Subcategory[];
  isActive: boolean;
}

const links = [
  { href: "/", label: "Accueil" },
  { href: "/boutique", label: "Boutique" },
  { href: "/apropos", label: "À propos" },
  { href: "/Artisans", label: "Artisans" },
] as const;

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const apiUser = (session as any)?.apiUser as { name?: string } | undefined;
  const sessionUser = session?.user;
  const isLoggedIn = status === "authenticated";
  const displayName = apiUser?.name || sessionUser?.name || sessionUser?.email || "Compte";

  const [showHeader, setShowHeader] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [mobileActiveCat, setMobileActiveCat] = useState<string | null>(null);

  const flyoutTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeCatId = useRef<string | null>(null);

  useEffect(() => {
    fetch(API_BASE)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.data) {
          setCategories(data.data.filter((c: Category) => c.isActive));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll < 20) setShowHeader(true);
      else if (currentScroll > lastScroll) setShowHeader(false);
      else setShowHeader(true);
      setLastScroll(currentScroll);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
    setFlyoutOpen(false);
  }, [pathname]);

  const handleCatEnter = (cat: Category) => {
    if (flyoutTimeout.current) clearTimeout(flyoutTimeout.current);
    activeCatId.current = cat._id;
    setActiveCategory(cat);
    setFlyoutOpen(true);
  };

  const handleCatLeave = () => {
    flyoutTimeout.current = setTimeout(() => {
      setFlyoutOpen(false);
    }, 200);
  };

  const handleFlyoutEnter = () => {
    if (flyoutTimeout.current) clearTimeout(flyoutTimeout.current);
  };

  return (
    <>
      <AnimatePresence>
        {showHeader && (
          <motion.header
            className="hdr"
            initial={{ y: -160, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -160, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* ── TOP BAR ── */}
            <div className="hdr__top">
              {/* Logo */}
              <Link href="/" className="hdr__logo">
                <img src={logo.src} width="44" alt="Tirjet" />
                <div className="hdr__logo-text">
                  <span className="hdr__logo-name">Tirjet</span>
                  <span className="hdr__logo-sub">ATELIER &amp; BOUTIQUE</span>
                </div>
              </Link>

              {/* Desktop nav links */}
              <nav className="hdr__nav">
                {links.map((link) => (
                  <Link key={link.href} href={link.href}
                    className={`hdr__nav-link${pathname === link.href ? " hdr__nav-link--active" : ""}`}>
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Desktop actions */}
              <div className="hdr__actions">
                <button className="hdr__icon-btn" aria-label="Panier">
                  <ShoppingBag size={18} />
                </button>

                {!isLoggedIn ? (
                  <Link href="/connexion">
                    <button className="hdr__btn hdr__btn--outline">Connexion</button>
                  </Link>
                ) : (
                  <div style={{ position: "relative" }}>
                    <button className="hdr__icon-btn" onClick={() => setUserMenuOpen(v => !v)} aria-label="Compte">
                      <User size={18} />
                    </button>
                    <AnimatePresence>
                      {userMenuOpen && (
                        <>
                          <div onClick={() => setUserMenuOpen(false)}
                            style={{ position: "fixed", inset: 0, zIndex: 999 }} />
                          <motion.div className="hdr__user-menu"
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.97 }}
                            transition={{ duration: 0.16 }}>
                            <div className="hdr__user-menu-name">{displayName}</div>
                            <button className="hdr__user-menu-item"
                              onClick={() => { setUserMenuOpen(false); router.push("/profile"); }}>
                              <User size={15} /> Profil
                            </button>
                            <button
                              className="hdr__user-menu-item"
                              onClick={() => {
                                setUserMenuOpen(false);
                                const role = (session as any)?.apiUser?.role;
                                if (role === "admin") {
                                  router.push("/dashboard/admin");
                                } else if (role === "vendor") {
                                  router.push("/dashboard/artisan");
                                } 
                              }}
                            >
                              <ShieldUser size={15} /> Dashboard
                            </button>
                            <button className="hdr__user-menu-item hdr__user-menu-item--danger"
                              onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: "/" }); }}>
                              <LogOut size={15} /> Se déconnecter
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <Link href="/Rejoigneznous">
                  <button className="hdr__btn hdr__btn--primary">REJOINDRE</button>
                </Link>
              </div>

              {/* Hamburger */}
              <button className="hdr__hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            {/* ── CATEGORY BAR ── */}
            {categories.length > 0 && (
              <div className="hdr__catbar">
                <div className="hdr__catbar-inner">
                  {categories.map((cat) => (
                    <div
                      key={cat._id}
                      className="hdr__catbar-item-wrap"
                      onMouseEnter={() => handleCatEnter(cat)}
                      onMouseLeave={handleCatLeave}
                    >
                      <button
                        className={`hdr__catbar-item${activeCategory?._id === cat._id && flyoutOpen ? " hdr__catbar-item--active" : ""}`}
                        onClick={() => {
                          router.push(`/boutique?category=${cat._id}`);
                          setFlyoutOpen(false);
                        }}
                      >
                        {cat.name}
                        {cat.subcategories.length > 0 && (
                          <motion.span
                            animate={{ rotate: activeCategory?._id === cat._id && flyoutOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ display: "inline-flex", marginLeft: 3 }}
                          >
                            <ChevronDown size={11} strokeWidth={2.5} />
                          </motion.span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                {/* ── FLYOUT PANEL ── */}
                <AnimatePresence>
                  {flyoutOpen && activeCategory && activeCategory.subcategories.length > 0 && (
                    <motion.div
                      className="hdr__flyout"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      onMouseEnter={handleFlyoutEnter}
                      onMouseLeave={handleCatLeave}
                    >
                      <div className="hdr__flyout-inner">
                        {/* Header */}
                        {/* <div className="hdr__flyout-header">
                          <div>
                            <p className="hdr__flyout-cat-name">{activeCategory.name}</p>
                            {activeCategory.description && (
                              <p className="hdr__flyout-cat-desc">{activeCategory.description}</p>
                            )}
                          </div>
                          <button
                            className="hdr__flyout-see-all"
                            onClick={() => {
                              router.push(`/boutique?category=${activeCategory._id}`);
                              setFlyoutOpen(false);
                            }}
                          >
                            Voir tout <ChevronRight size={13} />
                          </button>
                        </div> */}

                        {/* Subcategories grid */}
                        <div className="hdr__flyout-grid">
                          {activeCategory.subcategories.map((sub, i) => (
                            <motion.button
                              key={sub._id}
                              className="hdr__flyout-sub"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.035, duration: 0.22 }}
                              onClick={() => {
                                router.push(`/boutique?category=${activeCategory._id}&sub=${sub.slug}`);
                                setFlyoutOpen(false);
                              }}
                            >
                              <span className="hdr__flyout-sub-dot" />
                              {sub.name}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.header>
        )}
      </AnimatePresence>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div className="hdr__backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)} />
            <motion.div
              className="hdr__drawer"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <div className="hdr__drawer-handle" />
              <nav className="hdr__drawer-nav">
                {links.map((link, i) => (
                  <motion.div key={link.href}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}>
                    <Link href={link.href}
                      className={`hdr__drawer-link${pathname === link.href ? " hdr__drawer-link--active" : ""}`}
                      onClick={() => setMenuOpen(false)}>
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                {/* Mobile categories */}
                {categories.length > 0 && (
                  <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: links.length * 0.06 }}>
                    <button
                      className="hdr__drawer-link hdr__drawer-cat-toggle"
                      onClick={() => setMobileCatOpen(v => !v)}
                    >
                      <span>Catégories</span>
                      <motion.span animate={{ rotate: mobileCatOpen ? 180 : 0 }} transition={{ duration: 0.22 }}>
                        <ChevronDown size={16} />
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {mobileCatOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: "hidden" }}
                        >
                          {categories.map((cat) => (
                            <div key={cat._id} className="hdr__mobile-cat-group">
                              <button
                                className="hdr__mobile-cat-header"
                                onClick={() => setMobileActiveCat(mobileActiveCat === cat._id ? null : cat._id)}
                              >
                                <span>{cat.name}</span>
                                <motion.span
                                  animate={{ rotate: mobileActiveCat === cat._id ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}>
                                  <ChevronDown size={13} />
                                </motion.span>
                              </button>

                              <AnimatePresence>
                                {mobileActiveCat === cat._id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ overflow: "hidden" }}
                                  >
                                    <div className="hdr__mobile-sub-list">
                                      {cat.subcategories.map((sub) => (
                                        <button key={sub._id} className="hdr__mobile-sub-btn"
                                          onClick={() => {
                                            router.push(`/boutique?category=${cat._id}&sub=${sub.slug}`);
                                            setMenuOpen(false);
                                          }}>
                                          <ChevronRight size={11} style={{ opacity: 0.4 }} />
                                          {sub.name}
                                        </button>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </nav>

              <div className="hdr__drawer-divider" />
              <div className="hdr__drawer-actions">
                {!isLoggedIn ? (
                  <Link href="/connexion" onClick={() => setMenuOpen(false)}>
                    <button className="hdr__btn hdr__btn--outline" style={{ width: "100%" }}>Connexion</button>
                  </Link>
                ) : (
                  <>
                    <button className="hdr__btn hdr__btn--outline"
                      onClick={() => { setMenuOpen(false); router.push("/profile"); }}>
                      Mon profil
                    </button>
                    <button className="hdr__btn hdr__btn--outline"
                      onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}>
                      Se déconnecter
                    </button>
                  </>
                )}
                <Link href="/Rejoigneznous" onClick={() => setMenuOpen(false)}>
                  <button className="hdr__btn hdr__btn--primary" style={{ width: "100%" }}>REJOINDRE</button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;