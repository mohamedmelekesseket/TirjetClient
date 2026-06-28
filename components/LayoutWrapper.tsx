"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Header";
import Footer from "@/components/footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideHeader =
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