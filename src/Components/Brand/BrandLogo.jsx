// src/Components/Brand/BrandLogo.jsx
//
// Two-state brand mark that now cycles on its own instead of on
// hover/focus. A plain interval flips `active`; AnimatePresence
// crossfades between:
//   - /logo22.png → compact mark (default)
//   - /Logo1.png  → full detailed logo (alternate)
//
// prefers-reduced-motion is respected the same way the rest of this
// app's ambient motion is (see the marquee/spin-border/gradient-text
// media query in Welcome.jsx): if the user has that preference set,
// the cycle never starts and the badge just sits on the compact mark.
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const CYCLE_INTERVAL_MS = 3000;

export default function BrandLogo({
  badgeClassName = "",
  imgClassName = "w-full h-full p-1.5",
  logoSrc = "/Logo1.png",
  markSrc = "/logo22.png",
}) {
  const [active, setActive] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setActive((a) => !a), CYCLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <span
      role="img"
      aria-label="VMVAS"
      className={`relative inline-flex items-center justify-center overflow-hidden ${badgeClassName}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {active ? (
          <motion.img
            key="full-logo"
            src={logoSrc}
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`object-contain ${imgClassName}`}
          />
        ) : (
          <motion.img
            key="compact-mark"
            src={markSrc}
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.8, rotate: 8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`object-contain ${imgClassName}`}
          />
        )}
      </AnimatePresence>
    </span>
  );
}