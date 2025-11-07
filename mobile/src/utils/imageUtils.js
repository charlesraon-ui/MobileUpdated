// Utility to resolve image source for React Native and web
// Accepts string URL, local require, or null; returns proper source object/value
export function resolveImageSource(img, toAbsoluteUrl = null) {
  try {
    // If `img` is falsy, return null to let caller render fallback
    if (!img) return null;

    // If a function to absolutize URLs is provided, use it for strings
    const absolutize = (url) => {
      if (typeof toAbsoluteUrl === 'function') {
        try { return toAbsoluteUrl(url); } catch { return url; }
      }
      return url;
    };

    // If `img` is a string, treat as URI
    if (typeof img === 'string') {
      return { uri: absolutize(img) };
    }

    // If `img` is a module reference from require(), return as-is
    // React Native expects `source={require('...')}` without wrapping in `{ uri }`
    return img;
  } catch (e) {
    return null;
  }
}

// Convenience that tries multiple fields commonly used in product data
export function pickProductImageSource(product, toAbsoluteUrl = null) {
  const primary = product?.imageUrl;
  const secondary = Array.isArray(product?.images) ? product.images[0] : null;
  const img = primary || secondary || null;
  return resolveImageSource(img, toAbsoluteUrl);
}