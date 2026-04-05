"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/boutique", label: "boutique" },
  { href: "/apropos", label: "Apropos" },
  { href: "/Artisans", label: "Artisans" },
  { href: "/Rejoigneznous", label: "connexion" },
] as const;

const Header = () => {
  const pathname = usePathname();

  const [showHeader, setShowHeader] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;

      // always show at top
      if (currentScroll < 20) {
        setShowHeader(true);
      } else if (currentScroll > lastScroll) {
        // scrolling down
        setShowHeader(false);
      } else {
        // scrolling up
        setShowHeader(true);
      }

      setLastScroll(currentScroll);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  return (
    <AnimatePresence>
      {showHeader && (
        <motion.header
          className="header"
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            zIndex: 1000,
          }}
        >
          {/* TOP BAR */}
          <div className="topBar">
            <div className="logo">
              <div className="logoCircle">T</div>
              <div className="logoText">
                <h1>Tirjet</h1>
                <span>ATELIER & BOUTIQUE</span>
              </div>
            </div>
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

                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="activeBubble"
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                          }}
                        />
                      )}
                    </motion.span>
                  </Link>
                );
              })}
            </nav>
            <div className="actions">
              <Link key='connexion' href='/connexion' className="navWrapper">
                <button className="btnOutline">Connexion</button>
              </Link>
              <Link key='Rejoigneznous' href='/Rejoigneznous' className="navWrapper">
                <button className="btnPrimary">REJOINDRE </button>
              </Link>
            </div>
          </div>

          {/* NAVBAR */}
          
        </motion.header>
      )}
    </AnimatePresence>
  );
};

export default Header;