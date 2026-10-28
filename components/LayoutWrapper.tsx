"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Header";
import Footer from "@/components/footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showHomeSplash, setShowHomeSplash] = useState(pathname === "/");

  useEffect(() => {
    if (pathname !== "/") {
      setShowHomeSplash(false);
      return;
    }

    setShowHomeSplash(true);
    const timer = window.setTimeout(() => setShowHomeSplash(false), 1000);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const hideHeader =
    showHomeSplash ||
    pathname === "/connexion" ||
    pathname === "/formation-Formulaire" ||
    pathname === "/Rejoigneznous" ||
    pathname === "/privacy" ||
    pathname.startsWith("/dashboard");

  return (
    <>
      {!hideHeader && <Navbar />}
      {children}
      {!hideHeader && <Footer />}
    </>
  );
}