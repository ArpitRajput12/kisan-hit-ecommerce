/**
 * Production Image Fallbacks (Pure SVG Data URIs)
 * Ensures zero external image dependency, eliminating broken CDN links
 * and placeholder service watermarks.
 */

export const AGRI_PRODUCT_FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="16" fill="%23064e3b"/><circle cx="60" cy="50" r="24" fill="%23047857"/><path d="M60 36c-8 0-14 9-14 17 0 10 14 19 14 19s14-9 14-19c0-8-6-17-14-17z" fill="%23a7f3d0"/><text x="60" y="94" font-family="system-ui,-apple-system,sans-serif" font-weight="700" font-size="10" fill="%23a7f3d0" text-anchor="middle">KISAN HIT</text></svg>';

export const CROP_DISEASE_FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="160" viewBox="0 0 200 160"><rect width="200" height="160" rx="16" fill="%231c1917"/><circle cx="100" cy="70" r="30" fill="%237f1d1d"/><text x="100" y="78" font-size="28" text-anchor="middle">🔬</text><text x="100" y="125" font-family="system-ui,-apple-system,sans-serif" font-weight="700" font-size="11" fill="%23fca5a5" text-anchor="middle">KRISHI DIAGNOSIS</text></svg>';

