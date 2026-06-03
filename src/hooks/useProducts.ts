import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Category } from "@/lib/productTypes";

// Resolve every product image asset eagerly so we can look it up by filename.
// `import.meta.glob` with `eager` + `import: 'default'` returns a map of
// "/src/assets/products/<file>" -> bundled-and-hashed URL string.
// This sidesteps any need to guess Vite's hash format with regex.
const assetUrlByPath = import.meta.glob<string>(
  "/src/assets/products/*.{webp,jpg,jpeg,png,svg}",
  { eager: true, import: "default", query: "?url" }
);

// Build lookup tables keyed by the FILENAME (not full path) and by stem,
// so DB rows that store ".jpg" but disk has ".webp" still resolve.
const assetByFilename = new Map<string, string>();
const assetByStem = new Map<string, string>();
for (const [path, url] of Object.entries(assetUrlByPath)) {
  const file = path.split("/").pop() ?? "";
  const stem = file.replace(/\.(webp|jpg|jpeg|png|svg)$/i, "");
  assetByFilename.set(file, url);
  // Stem map: prefer .webp when multiple extensions exist for the same stem.
  if (!assetByStem.has(stem) || /\.webp$/i.test(file)) {
    assetByStem.set(stem, url);
  }
}

export function resolveProductImage(image: string): string {
  if (!image) return "";
  // Absolute URLs (Supabase storage, external CDNs) — pass through unchanged.
  if (/^https?:\/\//i.test(image)) return image;

  // Match by full filename first (handles legacy ".jpg" rows when disk has the
  // same filename), then fall back to stem (handles ".jpg" -> ".webp" swap).
  const file = image.split("/").pop() ?? image;
  const direct = assetByFilename.get(file);
  if (direct) return direct;

  const stem = file.replace(/\.(webp|jpg|jpeg|png|svg)$/i, "");
  const byStem = assetByStem.get(stem);
  if (byStem) return byStem;

  // Last resort — return as-is. The <img onError> in callers shows a placeholder.
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

async function loadMockProducts(): Promise<Product[]> {
  const { mockProducts } = await import("@/data/products");
  return mockProducts;
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
    return loadMockProducts();
  }
  if (!data || data.length === 0) return loadMockProducts();
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

// ---------- Realtime ----------
// Suscripción global a cambios en `products`. Cuando algo cambia
// (INSERT/UPDATE/DELETE), invalidamos cachés y refetcheamos para que
// todos los componentes montados se actualicen al instante.
let realtimeStarted = false;
function startRealtime() {
  if (realtimeStarted || typeof window === "undefined") return;
  realtimeStarted = true;
  supabase
    .channel("products-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "products" },
      () => {
        publicCache = null;
        adminCache = null;
        void loadPublic(true);
        if (adminSubscribers.size > 0) void loadAdmin(true);
      }
    )
    .subscribe();
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
