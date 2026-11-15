"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransition({
  children,
  dashboardContent = false,
}: {
  children: React.ReactNode;
  dashboardContent?: boolean;
}) {
  const pathname = usePathname();

  if (!dashboardContent && pathname.startsWith("/dashboard")) {
    return children;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className="site-page-shell"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
