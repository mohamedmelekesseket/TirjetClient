"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import {
  Menu, User, LogOut, X, ShoppingBag,
  ChevronDown, ShieldUser, ChevronRight, ArrowUpRight,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import logo from "../images/tirjet_app_icon (1).png";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/categories?mainCategory=artisanat`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Level4 { _id: string; name: string; slug: string; productCount?: number; }
interface Level3 { _id: string; name: string; slug: string; subcategories: Level4[]; }
interface Level2 { _id: string; name: string; slug: string; subcategories: Level3[]; }
interface Category {
  _id: string; name: string; description: string; slug: string;
  mainCategory: string; subcategories: Level2[]; isActive: boolean;
}

interface NavDropdownItem { label: string; href: string; }
interface NavLink { href: string; label: string; dropdown?: NavDropdownItem[]; }

const links: NavLink[] = [
  { href: "/", label: "Accueil" },
  {
    href: "/CultureAmazigh",
    label: "Culture Amazigh",
    dropdown: [
      { label: "Langue amazigh",             href: "/CultureAmazigh/langue" },
      { label: "Événements & traditions",     href: "/CultureAmazigh/evenements" },
      { label: "Symboles et motifs berbères", href: "/CultureAmazigh/symboles" },
      { label: "Musique amazigh",             href: "/CultureAmazigh/musique" },
      { label: "Patrimoine et Traditions",    href: "/CultureAmazigh/patrimoine" },
      { label: "Agriculture amazigh",         href: "/CultureAmazigh/agriculture" },
      { label: "Architecture amazigh",        href: "/CultureAmazigh/architecture" },
      { label: "Documentation",              href: "/CultureAmazigh/documentation" },
    ],
  },
  { href: "/Artisans", label: "Artisans" },
  {
    href: "/TourismeetLoisir",
    label: "Tourisme et Loisir",
    dropdown: [
      { label: "Maisons d'hôtes amazighes",      href: "/TourismeetLoisir/maisons-amazighes" },
      { label: "Maisons d'hôtes traditionnelles", href: "/TourismeetLoisir/maisons-traditionnelles" },
      { label: "Excursions",                     href: "/TourismeetLoisir/excursions" },
    ],
  },
  { href: "/apropos", label: "À propos" },
];

// ─── Small nav dropdown ───────────────────────────────────────────────────────
const NavItem = ({ link, isActive }: { link: NavLink; isActive: boolean }) => {
  const router  = useRouter();
  const [open,  setOpen]  = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => { if (timeout.current) clearTimeout(timeout.current); setOpen(true); };
  const hide = () => { timeout.current = setTimeout(() => setOpen(false), 150); };

  if (!link.dropdown) {
    return (
      <Link href={link.href}
        className={`hdr__nav-link${isActive ? " hdr__nav-link--active" : ""}`}>
        {link.label}
      </Link>
    );
  }

  return (
    <div className="hdr__nav-dd-wrap" onMouseEnter={show} onMouseLeave={hide}>
      <button
        className={`hdr__nav-link hdr__nav-link--btn${isActive ? " hdr__nav-link--active" : ""}${open ? " hdr__nav-link--open" : ""}`}
        onClick={() => router.push(link.href)}>
        {link.label}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}
          style={{ display: "inline-flex", marginLeft: 3 }}>
          <ChevronDown size={11} strokeWidth={2.5} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div className="hdr__nav-dd"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onMouseEnter={show} onMouseLeave={hide}>
            <Link href={link.href} className="hdr__nav-dd-all">
              Voir tout — {link.label} <ChevronRight size={11} />
            </Link>
            <div className="hdr__nav-dd-divider" />
            {link.dropdown.map((item) => (
              <Link key={item.href} href={item.href} className="hdr__nav-dd-item">
                <span className="hdr__dot" /> {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = () => {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session, status } = useSession();
  const apiUser     = (session as any)?.apiUser as { name?: string; role?: string } | undefined;
  const sessionUser = session?.user;
  const isLoggedIn  = status === "authenticated";
  const displayName = apiUser?.name || sessionUser?.name || sessionUser?.email || "Compte";

  const [showHeader,   setShowHeader]   = useState(true);
  const [lastScroll,   setLastScroll]   = useState(0);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categories,   setCategories]   = useState<Category[]>([]);

  // Mega-menu
  const [megaOpen, setMegaOpen] = useState(false);
  const [activeL1, setActiveL1] = useState<Category | null>(null);
  const [activeL2, setActiveL2] = useState<Level2 | null>(null);
  const [activeL3, setActiveL3] = useState<Level3 | null>(null);
  const megaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mobile
  const [mobileCatOpen,   setMobileCatOpen]   = useState(false);
  const [mobileActiveCat, setMobileActiveCat] = useState<string | null>(null);
  const [mobileActiveL2,  setMobileActiveL2]  = useState<string | null>(null);
  const [mobileNavOpen,   setMobileNavOpen]   = useState<string | null>(null);

  // ── Fetch categories ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(API_BASE)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.data) {
          const active = data.data.filter((c: Category) => c.isActive);
          setCategories(active);
          if (active.length > 0) {
            setActiveL1(active[0]);
            const l2 = active[0].subcategories?.[0] ?? null;
            setActiveL2(l2);
            setActiveL3(l2?.subcategories?.[0] ?? null);
          }
        }
      })
      .catch(() => {});
  }, []);

  // ── Hide on scroll down ─────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const cur = window.scrollY;
      if (cur < 20) setShowHeader(true);
      else if (cur > lastScroll) setShowHeader(false);
      else setShowHeader(true);
      setLastScroll(cur);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastScroll]);

  // ── Close everything on route change ───────────────────────────────────────
  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
    setMegaOpen(false);
    setMobileNavOpen(null);
  }, [pathname]);

  // ── Mega-menu helpers ───────────────────────────────────────────────────────
  const openMega = (cat: Category) => {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
    setActiveL1(cat);
    const l2 = cat.subcategories?.[0] ?? null;
    setActiveL2(l2);
    setActiveL3(l2?.subcategories?.[0] ?? null);
    setMegaOpen(true);
  };

  const scheduleMegaClose = () => {
    megaTimeout.current = setTimeout(() => setMegaOpen(false), 180);
  };

  const cancelMegaClose = () => {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
  };

  const selectL2 = (l2: Level2) => {
    setActiveL2(l2);
    setActiveL3(l2.subcategories?.[0] ?? null);
  };

  // ── Navigate and close mega ─────────────────────────────────────────────────
  const navigate = (url: string) => {
    router.push(url);
    setMegaOpen(false);
  };

  // ── Build category slug URL helpers ────────────────────────────────────────
  const catUrl  = (l1: Category)                                    => `/boutique/categorie/${l1.slug}`;
  const l2Url   = (l1: Category, l2: Level2)                        => `/boutique/categorie/${l1.slug}/${l2.slug}`;
  const l3Url   = (l1: Category, l2: Level2, l3: Level3)            => `/boutique/categorie/${l1.slug}/${l2.slug}/${l3.slug}`;
  const l4Url   = (l1: Category, l2: Level2, l3: Level3, l4: Level4)=> `/boutique/categorie/${l1.slug}/${l2.slug}/${l3.slug}/${l4.slug}`;

  return (
    <>
      <AnimatePresence>
        {showHeader && (
          <motion.header className="hdr"
            initial={{ y: -160, opacity: 0 }}
            animate={{ y: 0,    opacity: 1 }}
            exit={{ y: -160,    opacity: 0 }}
            transition={{ duration: 0.3 }}>

            {/* ══ TOP BAR ══════════════════════════════════════════════════════ */}
            <div className="hdr__top">
              <Link href="/" className="hdr__logo">
                <img src={logo.src} width="44" alt="Tirjet" />
                <div className="hdr__logo-text">
                  <span className="hdr__logo-name">Tirjet</span>
                  <span className="hdr__logo-sub">Culture &amp; Amazigh</span>
                </div>
              </Link>

              <nav className="hdr__nav">
                {links.map((link) => (
                  <NavItem key={link.href} link={link}
                    isActive={pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href + "/"))} />
                ))}
              </nav>

              <div className="hdr__actions">
                <button onClick={() => router.push("/Panier")} className="hdr__icon-btn" aria-label="Panier">
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
                            <button className="hdr__user-menu-item"
                              onClick={() => {
                                setUserMenuOpen(false);
                                const role = apiUser?.role;
                                if (role === "admin")       router.push("/dashboard/admin");
                                else if (role === "vendor") router.push("/dashboard/artisan");
                              }}>
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

              <button className="hdr__hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            {/* ══ CATEGORY BAR ═════════════════════════════════════════════════ */}
            {categories.length > 0 && (
              <div className="hdr__catbar" onMouseLeave={scheduleMegaClose}>
                <div className="hdr__catbar-inner">
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      className={`hdr__catbar-item${activeL1?._id === cat._id && megaOpen ? " hdr__catbar-item--active" : ""}`}
                      onMouseEnter={() => openMega(cat)}
                      onClick={() => navigate(catUrl(cat))}
                    >
                      {cat.name}
                      {cat.subcategories.length > 0 && (
                        <motion.span
                          animate={{ rotate: activeL1?._id === cat._id && megaOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ display: "inline-flex", marginLeft: 3 }}>
                          <ChevronDown size={11} strokeWidth={2.5} />
                        </motion.span>
                      )}
                    </button>
                  ))}
                </div>

                {/* ══ MEGA-MENU ═══════════════════════════════════════════════ */}
                <AnimatePresence>
                  {megaOpen && activeL1 && activeL1.subcategories.length > 0 && (
                    <motion.div className="mega"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1,  y: 0 }}
                      exit={{ opacity: 0,     y: -10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      onMouseEnter={cancelMegaClose}
                      onMouseLeave={scheduleMegaClose}>

                      <div className="mega__inner">

                        {/* ── Col 1: Category info ── */}
                        <div className="mega__col mega__col--info">
                          <p className="mega__col-label">Catégorie</p>
                          <h2 className="mega__cat-name">{activeL1.name}</h2>
                          {activeL1.description && (
                            <p className="mega__cat-desc">{activeL1.description}</p>
                          )}
                          <button
                            className="mega__see-all"
                            onClick={() => navigate(catUrl(activeL1))}>
                            Voir tout <ArrowUpRight size={14} strokeWidth={2} />
                          </button>
                        </div>

                        {/* ── Col 2: L2 — Univers ── */}
                        <div className="mega__col mega__col--l2">
                          <p className="mega__col-label">Univers</p>
                          {activeL1.subcategories.map((l2) => (
                            <button
                              key={l2._id}
                              className={`mega__row${activeL2?._id === l2._id ? " mega__row--active" : ""}`}
                              onMouseEnter={() => selectL2(l2)}
                              onClick={() => navigate(l2Url(activeL1, l2))}
                            >
                              <span>{l2.name}</span>
                              {l2.subcategories.length > 0 && (
                                <ChevronRight size={13} className="mega__row-chevron" />
                              )}
                            </button>
                          ))}
                        </div>

                        {/* ── Col 3: L3 — Collection ── */}
                        <div className="mega__col mega__col--l3">
                          {activeL2 && activeL2.subcategories.length > 0 && (
                            <AnimatePresence mode="wait">
                              <motion.div key={activeL2._id}
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ duration: 0.14 }}>
                                <p className="mega__col-label">Collection</p>
                                {activeL2.subcategories.map((l3) => (
                                  <button
                                    key={l3._id}
                                    className={`mega__row${activeL3?._id === l3._id ? " mega__row--active" : ""}`}
                                    onMouseEnter={() => setActiveL3(l3)}
                                    onClick={() => navigate(l3Url(activeL1, activeL2, l3))}
                                  >
                                    <span>{l3.name}</span>
                                    {l3.subcategories.length > 0 && (
                                      <ChevronRight size={13} className="mega__row-chevron" />
                                    )}
                                  </button>
                                ))}
                              </motion.div>
                            </AnimatePresence>
                          )}
                        </div>

                        {/* ── Col 4: L4 — Pièces ── */}
                        <div className="mega__col mega__col--l4">
                          {activeL3 && activeL3.subcategories.length > 0 && activeL2 && (
                            <AnimatePresence mode="wait">
                              <motion.div key={activeL3._id}
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ duration: 0.14 }}>
                                <p className="mega__col-label">Pièces</p>
                                {activeL3.subcategories.map((l4) => (
                                  <button
                                    key={l4._id}
                                    className="mega__leaf"
                                    onClick={() => navigate(l4Url(activeL1, activeL2!, activeL3, l4))}
                                  >
                                    <span className="mega__leaf-dot" />
                                    <span className="mega__leaf-name">{l4.name}</span>
                                    {l4.productCount != null && l4.productCount > 0 && (
                                      <span className="mega__leaf-count">{l4.productCount}</span>
                                    )}
                                  </button>
                                ))}
                              </motion.div>
                            </AnimatePresence>
                          )}
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

      {/* ══ MOBILE DRAWER ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div className="hdr__backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)} />

            <motion.div className="hdr__drawer"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}>

              <div className="hdr__drawer-handle" />

              <nav className="hdr__drawer-nav">

                {/* Nav links */}
                {links.map((link, i) => (
                  <motion.div key={link.href}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}>
                    {!link.dropdown ? (
                      <Link href={link.href}
                        className={`hdr__drawer-link${pathname === link.href ? " hdr__drawer-link--active" : ""}`}
                        onClick={() => setMenuOpen(false)}>
                        {link.label}
                      </Link>
                    ) : (
                      <>
                        <button
                          className={`hdr__drawer-link hdr__drawer-cat-toggle${pathname.startsWith(link.href) ? " hdr__drawer-link--active" : ""}`}
                          onClick={() => setMobileNavOpen(mobileNavOpen === link.href ? null : link.href)}>
                          <span>{link.label}</span>
                          <motion.span animate={{ rotate: mobileNavOpen === link.href ? 180 : 0 }} transition={{ duration: 0.22 }}>
                            <ChevronDown size={16} />
                          </motion.span>
                        </button>
                        <AnimatePresence>
                          {mobileNavOpen === link.href && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                              style={{ overflow: "hidden" }}>
                              <Link href={link.href} className="hdr__mobile-nav-see-all" onClick={() => setMenuOpen(false)}>
                                Voir tout — {link.label} <ChevronRight size={12} />
                              </Link>
                              <div className="hdr__mobile-sub-list">
                                {link.dropdown.map((item) => (
                                  <Link key={item.href} href={item.href} className="hdr__mobile-nav-item" onClick={() => setMenuOpen(false)}>
                                    <ChevronRight size={11} style={{ opacity: 0.35, flexShrink: 0 }} /> {item.label}
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </motion.div>
                ))}

                {/* Boutique categories */}
                {categories.length > 0 && (
                  <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: links.length * 0.06 }}>
                    <button className="hdr__drawer-link hdr__drawer-cat-toggle" onClick={() => setMobileCatOpen(v => !v)}>
                      <span>Boutique</span>
                      <motion.span animate={{ rotate: mobileCatOpen ? 180 : 0 }} transition={{ duration: 0.22 }}>
                        <ChevronDown size={16} />
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {mobileCatOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                          style={{ overflow: "hidden" }}>

                          {categories.map((cat) => (
                            <div key={cat._id} className="hdr__mobile-cat-group">
                              <button className="hdr__mobile-cat-header"
                                onClick={() => setMobileActiveCat(mobileActiveCat === cat._id ? null : cat._id)}>
                                <span>{cat.name}</span>
                                <motion.span animate={{ rotate: mobileActiveCat === cat._id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                  <ChevronDown size={13} />
                                </motion.span>
                              </button>

                              <AnimatePresence>
                                {mobileActiveCat === cat._id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                    style={{ overflow: "hidden" }}>

                                    {/* "See all" for L1 */}
                                    <button
                                      className="hdr__mobile-nav-see-all"
                                      onClick={() => {
                                        router.push(catUrl(cat));
                                        setMenuOpen(false);
                                      }}>
                                      Voir tout — {cat.name} <ChevronRight size={12} />
                                    </button>

                                    {/* L2 list */}
                                    {cat.subcategories.map((l2) => (
                                      <div key={l2._id} className="hdr__mobile-l2-group">
                                        <button className="hdr__mobile-l2-header"
                                          onClick={() => {
                                            if (l2.subcategories.length > 0) {
                                              setMobileActiveL2(mobileActiveL2 === l2._id ? null : l2._id);
                                            } else {
                                              router.push(l2Url(cat, l2));
                                              setMenuOpen(false);
                                            }
                                          }}>
                                          <ChevronRight size={11} style={{ opacity: 0.4, flexShrink: 0 }} />
                                          <span style={{ flex: 1 }}>{l2.name}</span>
                                          {l2.subcategories.length > 0 && (
                                            <motion.span animate={{ rotate: mobileActiveL2 === l2._id ? 90 : 0 }} transition={{ duration: 0.18 }}>
                                              <ChevronRight size={11} style={{ opacity: 0.4 }} />
                                            </motion.span>
                                          )}
                                        </button>

                                        {/* L3 list */}
                                        <AnimatePresence>
                                          {mobileActiveL2 === l2._id && l2.subcategories.length > 0 && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                                              style={{ overflow: "hidden" }}>
                                              <div className="hdr__mobile-sub-list">
                                                {l2.subcategories.map((l3) => (
                                                  <button key={l3._id} className="hdr__mobile-sub-btn"
                                                    onClick={() => {
                                                      router.push(l3Url(cat, l2, l3));
                                                      setMenuOpen(false);
                                                    }}>
                                                    <ChevronRight size={9} style={{ opacity: 0.3 }} />
                                                    {l3.name}
                                                    {l3.subcategories.length > 0 && (
                                                      <span className="hdr__mobile-sub-count">{l3.subcategories.length}</span>
                                                    )}
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