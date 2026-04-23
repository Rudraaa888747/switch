import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeImageUrl(url?: string | null) {
  if (!url) return "";
  try {
    const u = new URL(url);
    // Prevent broken images from accidental double slashes in object paths (e.g. /bucket//file.jpg)
    u.pathname = u.pathname.replace(/\/{2,}/g, "/");
    return u.toString();
  } catch {
    return url;
  }
}

// Get product image from variants or fallback to legacy image
export function getProductImage(product: {
  variants?: { color: string; images: string[] }[];
  image?: string;
  images?: string[];
}, selectedColor?: string): string {
  if (product.variants && product.variants.length > 0) {
    const variant = selectedColor 
      ? product.variants.find(v => v.color === selectedColor) || product.variants[0]
      : product.variants[0];
    if (variant?.images?.[0]) {
      return normalizeImageUrl(variant.images[0]);
    }
  }
  return normalizeImageUrl(product.image || product.images?.[0] || '');
}

