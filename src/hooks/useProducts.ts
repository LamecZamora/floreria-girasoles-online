import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mockProducts, type Product, type Category } from "@/data/products";

// Map of legacy local image paths -> imported asset modules.
// We register BOTH .jpg and .webp variants so DB rows that still reference
// the old ".jpg" filename keep resolving to the new bundled WebP asset.
//
// IMPORTANT: Vite's content-hash is appended right before the extension and
// is *exactly* 8 url-safe base64 chars (e.g. "caja-aniversario-DXyZpQ_h.webp").
// Match that exactly — a looser regex like `-[A-Za-z0-9_]{6,}` wrongly strips
// real name segments such as "-aniversario", "-graduacion", "-flores", etc.
function viteStripHash(filename: string): string {
  // Vite hashes are 8 url-safe-base64 chars and almost always include at least
  // one uppercase letter, digit, or underscore. Project asset names are
  // lowercase ascii words separated by hyphens, so requiring a "hash-like"
  // character class here avoids stripping real name segments such as
  // "memorial", "vertical", "tropical", "interior", etc.
  return filename.replace(
    /-(?=[A-Za-z0-9_-]{8}\.)(?=[A-Za-z0-9_-]*[A-Z0-9_])[A-Za-z0-9_-]{8}\.(jpg|jpeg|png|webp|svg)$/i,
    ".$1"
  );
}

const localImageMap = new Map<string, string>();
for (const p of mockProducts) {
  // p.image is the resolved Vite URL (already has hash baked in at build time,
  // or is the raw "/src/assets/..." path during dev).
  const file = p.image.split("/").pop() || p.image;
  const cleanFile = viteStripHash(file);
  const stem = cleanFile.replace(/\.(webp|jpg|jpeg|png|svg)$/i, "");
  // Register every plausible legacy path the DB might still hold.
  localImageMap.set(`/src/assets/products/${cleanFile}`, p.image);
  localImageMap.set(`/src/assets/products/${stem}.jpg`, p.image);
  localImageMap.set(`/src/assets/products/${stem}.jpeg`, p.image);
  localImageMap.set(`/src/assets/products/${stem}.png`, p.image);
  localImageMap.set(`/src/assets/products/${stem}.webp`, p.image);
}

export function resolveProductImage(image: string): string {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  const mapped = localImageMap.get(image);
  if (mapped) return mapped;
  // Last-resort fallback: try matching by basename only.
  const file = image.split("/").pop();
  if (file) {
    const stem = viteStripHash(file).replace(/\.(webp|jpg|jpeg|png|svg)$/i, "");
    const fallback = localImageMap.get(`/src/assets/products/${stem}.webp`);
    if (fallback) return fallback;
  }
  return image;
}

export interface DbProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  active: boolean;
}

export function dbToProduct(p: DbProduct): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    stock: p.stock,
    image: resolveProductImage(p.image),
    category: p.category as Category,
  };
}

// ---------- Module-level cache ----------
// Shared across all consumers so navigating between routes is instant.
const STALE_MS = 5 * 60_000; // 5 minutes
type CacheEntry = { data: Product[]; ts: number };
let publicCache: CacheEntry | null = null;
let publicInflight: Promise<Product[]> | null = null;
const publicSubscribers = new Set<(p: Product[]) => void>();

let adminCache: { data: DbProduct[]; ts: number } | null = null;
let adminInflight: Promise<DbProduct[]> | null = null;
const adminSubscribers = new Set<(p: DbProduct[]) => void>();

async function fetchPublicProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("category", { ascending: true })
    .order("id", { ascending: true })
    .limit(1000);

  if (error) {
    console.error("Error loading products:", error);
    return mockProducts;
  }
  if (!data || data.length === 0) return mockProducts;
  return data.map(dbToProduct);
}

async function loadPublic(force = false): Promise<Product[]> {
  if (!force && publicCache && Date.now() - publicCache.ts < STALE_MS) {
    return publicCache.data;
  }
  if (publicInflight) return publicInflight;
  publicInflight = fetchPublicProducts()
    .then((products) => {
      publicCache = { data: products, ts: Date.now() };
      publicSubscribers.forEach((cb) => cb(products));
      return products;
    })
    .finally(() => {
      publicInflight = null;
    });
  return publicInflight;
}

/** Public helper: trigger a background fetch (used by root to warm the cache). */
export function prefetchProducts() {
  if (typeof window === "undefined") return;
  if (publicCache && Date.now() - publicCache.ts < STALE_MS) return;
  void loadPublic();
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => publicCache?.data ?? []);
  const [loading, setLoading] = useState(() => !publicCache);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadPublic(true);
      setProducts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const sub = (data: Product[]) => { if (mounted) setProducts(data); };
    publicSubscribers.add(sub);

    if (publicCache && Date.now() - publicCache.ts < STALE_MS) {
      // Fresh cache — instant render
      setProducts(publicCache.data);
      setLoading(false);
    } else {
      loadPublic().then((data) => {
        if (mounted) {
          setProducts(data);
          setLoading(false);
        }
      });
    }

    return () => {
      mounted = false;
      publicSubscribers.delete(sub);
    };
  }, []);

  return { products, loading, error, refetch };
}

async function fetchAdminProducts(): Promise<DbProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error || !data) return [];
  return data as DbProduct[];
}

async function loadAdmin(force = false): Promise<DbProduct[]> {
  if (!force && adminCache && Date.now() - adminCache.ts < STALE_MS) {
    return adminCache.data;
  }
  if (adminInflight) return adminInflight;
  adminInflight = fetchAdminProducts()
    .then((products) => {
      adminCache = { data: products, ts: Date.now() };
      adminSubscribers.forEach((cb) => cb(products));
      return products;
    })
    .finally(() => {
      adminInflight = null;
    });
  return adminInflight;
}

export function useAllProductsAdmin() {
  const [products, setProducts] = useState<DbProduct[]>(() => adminCache?.data ?? []);
  const [loading, setLoading] = useState(() => !adminCache);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      // Force refetch + invalidate public cache (admin edits affect catalog too)
      const data = await loadAdmin(true);
      publicCache = null;
      loadPublic(true);
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const sub = (data: DbProduct[]) => { if (mounted) setProducts(data); };
    adminSubscribers.add(sub);

    if (adminCache && Date.now() - adminCache.ts < STALE_MS) {
      setProducts(adminCache.data);
      setLoading(false);
    } else {
      loadAdmin().then((data) => {
        if (mounted) {
          setProducts(data);
          setLoading(false);
        }
      });
    }

    return () => {
      mounted = false;
      adminSubscribers.delete(sub);
    };
  }, []);

  return { products, loading, refetch };
}
