"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/boutique", label: "Boutique" },
  { href: "/apropos", label: "À propos" },
  { href: "/Artisans", label: "Artisans" },
] as const;

const Header = () => {
  const pathname = usePathname();
  const [showHeader, setShowHeader] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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
  }, [pathname]);

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
                <div className="logoCircle">T</div>
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
              </nav>

              {/* DESKTOP ACTIONS */}
              <div className="actions">
                <Link href="/connexion">
                  <button className="btnOutline">Connexion</button>
                </Link>
                <Link href="/Rejoigneznous">
                  <button className="btnPrimary">REJOINDRE</button>
                </Link>
              </div>

              {/* HAMBURGER */}
              <button
                className="hamburger"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Toggle menu"
              >
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
            <motion.div
              className="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />

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
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <Link
                        href={link.href}
                        className={`drawerLink ${isActive ? "drawerLinkActive" : ""}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <div className="drawerDivider" />

              <div className="drawerActions">
                <Link href="/connexion" onClick={() => setMenuOpen(false)}>
                  <button className="drawerBtnOutline">Connexion</button>
                </Link>
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