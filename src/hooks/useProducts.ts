import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mockProducts, type Product, type Category } from "@/data/products";

// Map of legacy local image paths -> imported asset modules.
// Products migrated from src/data/products.ts use paths like
// "/src/assets/products/foo.jpg" — Vite cannot serve those at runtime,
// so we resolve them to the bundled URL via the mock dataset.
const localImageMap = new Map<string, string>(
  mockProducts.map((p) => [`/src/assets/products/${imageBasename(p.image)}`, p.image])
);

function imageBasename(src: string): string {
  // Vite-imported assets resolve to URLs like /assets/foo-abc123.jpg or
  // base64; for our mock products they are .jpg filenames. Extract the
  // basename without hash suffix to use as lookup key.
  const url = src.split("/").pop() || src;
  // Strip Vite hash suffix: name-HASH.jpg -> name.jpg
  return url.replace(/-[A-Za-z0-9_]{6,}\.(jpg|jpeg|png|webp|svg)$/i, ".$1");
}

export function resolveProductImage(image: string): string {
  if (!image) return "";
  // Already a full URL (Storage / CDN)
  if (/^https?:\/\//i.test(image)) return image;
  // Local migrated path -> bundled URL
  const mapped = localImageMap.get(image);
  if (mapped) return mapped;
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

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("category", { ascending: true })
      .order("id", { ascending: true })
      .limit(1000);

    if (error) {
      console.error("Error loading products:", error);
      setError(error.message);
      // Fallback to mock data so the catalogue is never empty
      setProducts(mockProducts);
    } else if (data && data.length > 0) {
      setProducts(data.map(dbToProduct));
    } else {
      setProducts(mockProducts);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { products, loading, error, refetch };
}

export function useAllProductsAdmin() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (!error && data) setProducts(data as DbProduct[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { products, loading, refetch };
}
