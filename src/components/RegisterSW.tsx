"use client";

import { useEffect } from "react";

/** Registra o service worker para tornar o app instalável (PWA). */
export default function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
