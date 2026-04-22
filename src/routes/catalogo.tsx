import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { type Category } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import CategoryFilter from "@/components/CategoryFilter";
import { Search, X, Loader2 } from "lucide-react";

const PAGE_SIZE = 12;

export const Route = createFileRoute("/catalogo")({
  component: CatalogoPage,
  head: () => ({
    meta: [
      { title: "Catálogo - Florería Girasoles" },
      { name: "description", content: "Explora nuestra colección de arreglos florales artesanales. Bodas, XV años, cumpleaños, condolencias y más." },
      { property: "og:title", content: "Catálogo - Florería Girasoles" },
      { property: "og:description", content: "Explora nuestra colección de arreglos florales artesanales." },
    ],
  }),
});

function CatalogoPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const { products, loading } = useProducts();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [selectedCategory, search, sortBy]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let results = products.filter((p) => {
      const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
      if (!term) return matchCategory;
      return matchCategory && (p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
    });
    if (sortBy === "price-asc") results = [...results].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") results = [...results].sort((a, b) => b.price - a.price);
    return results;
  }, [products, selectedCategory, search, sortBy]);

  const visibleProducts = useMemo(() => filtered.slice(0, visible), [filtered, visible]);
  const hasMore = visible < filtered.length;

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, filtered.length]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
      <div className="text-center mb-10 sm:mb-14">
        <h1 className="section-heading text-3xl sm:text-4xl md:text-5xl mb-3">Catálogo Completo</h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
          Explora nuestra colección de {products.length} arreglos florales artesanales.
        </p>
      </div>

      {/* Search & Sort */}
      <div className="max-w-2xl mx-auto mb-8 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar arreglos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={100}
            className="w-full pl-10 pr-10 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm sm:text-base shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-all"
              aria-label="Limpiar"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "default" | "price-asc" | "price-desc")}
          className="px-3 py-3 rounded-lg border border-border bg-card text-foreground text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-auto"
          aria-label="Ordenar por"
        >
          <option value="default">Ordenar</option>
          <option value="price-asc">Menor precio</option>
          <option value="price-desc">Mayor precio</option>
        </select>
      </div>

      <div className="mb-8">
        <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-lg font-heading font-semibold text-foreground">No se encontraron productos</p>
          <p className="text-sm text-muted-foreground mt-1">Intenta con otra búsqueda o categoría</p>
          <button
            onClick={() => { setSearch(""); setSelectedCategory("all"); }}
            className="btn-primary text-sm mt-6"
          >
            Ver todos
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4 text-center sm:text-left">
            {filtered.length} producto{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {visibleProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
