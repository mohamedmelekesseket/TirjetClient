"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Menu, User, LogOut, X, ShoppingBag, ChevronDown } from "lucide-react";
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
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [mobileActiveCat, setMobileActiveCat] = useState<string | null>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const catTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(API_BASE)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.data) {
          setCategories(data.data.filter((c: Category) => c.isActive));
          setActiveCategory(data.data.filter((c: Category) => c.isActive)[0] ?? null);
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
    setCatMenuOpen(false);
  }, [pathname]);

  const handleCatEnter = () => {
    if (catTimeout.current) clearTimeout(catTimeout.current);
    setCatMenuOpen(true);
  };

  const handleCatLeave = () => {
    catTimeout.current = setTimeout(() => setCatMenuOpen(false), 180);
  };

  return (
    <>
      <AnimatePresence>
        {showHeader && (
          <motion.header
            className="header"
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 1000 }}
          >
            <div className="topBar">
              {/* LOGO */}
              <div className="logo">
                <img src={logo.src} width="50px" alt="" />
                <div className="logoText">
                  <h1>Tirjet</h1>
                  <span>ATELIER & BOUTIQUE</span>
                </div>
              </div>

              {/* DESKTOP NAV */}
              <nav className="navbarHeader">
                {links.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link key={link.href} href={link.href} className="navWrapper">
                      <motion.span
                        className={`navItem ${isActive ? "active" : ""}`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {link.label}
                      </motion.span>
                    </Link>
                  );
                })}

                {/* CATEGORIES MEGA MENU TRIGGER */}
                {categories.length > 0 && (
                  <div
                    ref={catRef}
                    className="catTriggerWrap"
                    onMouseEnter={handleCatEnter}
                    onMouseLeave={handleCatLeave}
                  >
                    <motion.button
                      className={`navItem catTrigger ${catMenuOpen ? "active" : ""}`}
                      whileHover={{ scale: 1.05 }}
                      aria-haspopup="true"
                      aria-expanded={catMenuOpen}
                    >
                      Catégories
                      <motion.span
                        animate={{ rotate: catMenuOpen ? 180 : 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ display: "inline-flex", marginLeft: 4 }}
                      >
                        <ChevronDown size={13} />
                      </motion.span>
                    </motion.button>

                    <AnimatePresence>
                      {catMenuOpen && (
                        <motion.div
                          className="megaMenu"
                          initial={{ opacity: 0, y: 12, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 12, scale: 0.98 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          onMouseEnter={handleCatEnter}
                          onMouseLeave={handleCatLeave}
                        >
                          {/* LEFT: category list */}
                          <div className="megaLeft">
                            <p className="megaLeftTitle">Catégories</p>
                            {categories.map((cat) => (
                              <button
                                key={cat._id}
                                className={`megaCatBtn ${activeCategory?._id === cat._id ? "megaCatBtn--active" : ""}`}
                                onMouseEnter={() => setActiveCategory(cat)}
                                onClick={() => {
                                  router.push(`/boutique?category=${cat._id}`);
                                  setCatMenuOpen(false);
                                }}
                              >
                                <span>{cat.name}</span>
                                <ChevronDown size={12} style={{ transform: "rotate(-90deg)", opacity: 0.5 }} />
                              </button>
                            ))}
                          </div>

                          {/* DIVIDER */}
                          <div className="megaDivider" />

                          {/* RIGHT: subcategories */}
                          <div className="megaRight">
                            <AnimatePresence mode="wait">
                              {activeCategory && (
                                <motion.div
                                  key={activeCategory._id}
                                  initial={{ opacity: 0, x: 10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -10 }}
                                  transition={{ duration: 0.18 }}
                                >
                                  <p className="megaRightTitle">{activeCategory.name}</p>
                                  {activeCategory.description && (
                                    <p className="megaRightDesc">{activeCategory.description}</p>
                                  )}
                                  <div className="megaSubGrid">
                                    {activeCategory.subcategories.map((sub, i) => (
                                      <motion.button
                                        key={sub._id}
                                        className="megaSubBtn"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        onClick={() => {
                                          router.push(`/boutique?category=${activeCategory._id}&sub=${sub.slug}`);
                                          setCatMenuOpen(false);
                                        }}
                                      >
                                        {sub.name}
                                      </motion.button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </nav>

              {/* DESKTOP ACTIONS */}
              <div className="actions">
                <button
                  type="button"
                  className="btnOutline"
                  aria-label="Panier"
                  style={{ padding: 10, width: 42, height: 42, display: "grid", placeItems: "center" }}
                >
                  <ShoppingBag size={18} />
                </button>

                {!isLoggedIn ? (
                  <Link href="/connexion">
                    <button className="btnOutline">Connexion</button>
                  </Link>
                ) : (
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      className="btnOutline"
                      aria-label="Compte"
                      aria-haspopup="menu"
                      aria-expanded={userMenuOpen}
                      onClick={() => setUserMenuOpen((v) => !v)}
                      style={{ padding: 10, width: 42, height: 42, display: "grid", placeItems: "center" }}
                    >
                      <User size={18} />
                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <>
                          <div onClick={() => setUserMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 999 }} />
                          <motion.div
                            role="menu"
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.16 }}
                            style={{
                              position: "absolute", right: 0, top: "calc(100% + 10px)", zIndex: 1000,
                              minWidth: 220, background: "rgba(250,246,241,0.98)",
                              border: "1px solid rgba(205,133,80,0.18)",
                              boxShadow: "0 14px 40px rgba(44,24,16,0.14)",
                              borderRadius: 14, overflow: "hidden", backdropFilter: "blur(12px)",
                            }}
                          >
                            <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(205,133,80,0.14)", fontSize: 14, fontWeight: 700, color: "#2c1810" }}>
                              {displayName}
                            </div>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => { setUserMenuOpen(false); router.push("/profile"); }}
                              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer", color: "#2c1810", fontSize: 14 }}
                            >
                              <User size={16} /> Profil
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer", color: "#b42318", fontSize: 14 }}
                            >
                              <LogOut size={16} /> Se déconnecter
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <Link href="/Rejoigneznous">
                  <button className="btnPrimary">REJOINDRE</button>
                </Link>
              </div>

              {/* HAMBURGER */}
              <button className="hamburger" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div className="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenuOpen(false)} />
            <motion.div
              className="drawer"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <div className="drawerHandle" />
              <nav className="drawerNav">
                {links.map((link, i) => {
                  const isActive = pathname === link.href;
                  return (
                    <motion.div key={link.href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                      <Link href={link.href} className={`drawerLink ${isActive ? "drawerLinkActive" : ""}`} onClick={() => setMenuOpen(false)}>
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}

                {/* MOBILE CATEGORIES */}
                {categories.length > 0 && (
                  <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: links.length * 0.06 }}>
                    <button
                      className="drawerLink drawerCatToggle"
                      onClick={() => setMobileCatOpen((v) => !v)}
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
                            <div key={cat._id} className="mobileCatGroup">
                              <button
                                className="mobileCatHeader"
                                onClick={() => setMobileActiveCat(mobileActiveCat === cat._id ? null : cat._id)}
                              >
                                <span>{cat.name}</span>
                                <motion.span animate={{ rotate: mobileActiveCat === cat._id ? 180 : 0 }} transition={{ duration: 0.2 }}>
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
                                    <div className="mobileSubList">
                                      {cat.subcategories.map((sub) => (
                                        <button
                                          key={sub._id}
                                          className="mobileSubBtn"
                                          onClick={() => {
                                            router.push(`/boutique?category=${cat._id}&sub=${sub.slug}`);
                                            setMenuOpen(false);
                                          }}
                                        >
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

              <div className="drawerDivider" />
              <div className="drawerActions">
                {!isLoggedIn ? (
                  <Link href="/connexion" onClick={() => setMenuOpen(false)}>
                    <button className="drawerBtnOutline">Connexion</button>
                  </Link>
                ) : (
                  <>
                    <button className="drawerBtnOutline" onClick={() => { setMenuOpen(false); router.push("/profile"); }}>Mon profil</button>
                    <button className="drawerBtnOutline" onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}>Se déconnecter</button>
                  </>
                )}
                <Link href="/Rejoigneznous" onClick={() => setMenuOpen(false)}>
                  <button className="drawerBtnPrimary">REJOINDRE</button>
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