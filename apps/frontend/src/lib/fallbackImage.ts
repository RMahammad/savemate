import type { SyntheticEvent } from "react";

export const FALLBACK_IMAGE_URL =
  "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

export function handleImgErrorSwapToFallback(
  e: SyntheticEvent<HTMLImageElement>
) {
  const img = e.currentTarget;
  if (!img) return;

  // Prevent infinite loops if the fallback fails for any reason.
  img.onerror = null;
  img.src = FALLBACK_IMAGE_URL;
}
