'use client';

import React from 'react';
import Link from 'next/link';
import { motion,Variants  } from 'framer-motion';
import { ShoppingBag, Mail, Phone, MapPin } from 'lucide-react';
import logo from "../images/logo2 (2).png";

export default function CompactFooter() {
  const currentYear = new Date().getFullYear();

  // Parents container: triggers children one by one
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  // Individual column animation: subtle slide up
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,      
      },
    },
  };

  return (
    <motion.footer 
      className="art-compact-footer"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={containerVariants}
    >

      <div className="art-compact-container">
        <div className="art-compact-grid">
          
          {/* Brand Column */}
          <motion.div variants={itemVariants} className="art-compact-col">
            <Link href="/" className="art-compact-logo">
              {/* <ShoppingBag size={20} className="art-compact-icon" /> */}
              <img src={logo.src} width="144" alt="Tirjet" />

            </Link>
            <p className="art-compact-tagline">
              La marketplace de l'Tirjett authentique.<br/>
              Connecter les artisans au monde.
            </p>
          </motion.div>

          {/* Navigation Column */}
          <motion.div variants={itemVariants} className="art-compact-col">
            <h3 className="art-compact-title">Navigation</h3>
            <ul className="art-compact-list">
              <li><Link href="/">Accueil</Link></li>
              <li><Link href="/boutique">Marketplace</Link></li>
              <li><Link href="/apropos">À propos</Link></li>
            </ul>
          </motion.div>

          {/* Artisans Column */}
          <motion.div variants={itemVariants} className="art-compact-col">
            <h3 className="art-compact-title">Artisans</h3>
            <ul className="art-compact-list">
              <li><Link href="/Rejoigneznous">Devenir artisan</Link></li>
              <li><Link href="/connexion">Connexion</Link></li>
            </ul>
          </motion.div>

          {/* Contact Column */}
          <motion.div variants={itemVariants} className="art-compact-col">
            <h3 className="art-compact-title">Contact</h3>
            <ul className="art-compact-contact">
              <li className="contact-link"><Mail size={14} /> contact@tirjet.com</li>
              <li className="contact-link"><Phone size={14} /> +216 00 000 000</li>
              <li className="contact-link"><MapPin size={14} /> Tunisia, Tunis</li>
            </ul>
          </motion.div>

        </div>

        {/* Bottom Bar with its own subtle fade */}
        <motion.div 
          variants={itemVariants} 
          className="art-compact-bottom"
        >
          <p>Copyright © 2025, TAMAGUIT. Developed by TAMAGUIT</p>
        </motion.div>
      </div>
    </motion.footer>
  );
}