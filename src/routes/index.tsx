import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { type Category } from "@/lib/productTypes";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import CategoryFilter from "@/components/CategoryFilter";
import HeroSection from "@/components/HeroSection";
import { Sparkles, ArrowRight, Truck, Shield, Heart, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Florería Girasoles Durango | Arreglos Florales Artesanales" },
      { name: "description", content: "Florería Girasoles en Durango, México. Arreglos florales artesanales para bodas, XV años, cumpleaños y todo momento especial. Entrega a domicilio." },
      { name: "keywords", content: "florería girasoles, floreria girasoles durango, arreglos florales durango, ramos de flores, bodas, xv años, flores a domicilio durango" },
      { property: "og:title", content: "Florería Girasoles Durango | Arreglos Florales Artesanales" },
      { property: "og:description", content: "Arreglos florales artesanales en Durango. Bodas, XV años, cumpleaños y entregas a domicilio." },
      { property: "og:url", content: "https://floreria-girasoles.lovable.app/" },
    ],
    links: [
      { rel: "canonical", href: "https://floreria-girasoles.lovable.app/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Florist",
          name: "Florería Girasoles",
          description: "Arreglos florales artesanales en Durango, México.",
          url: "https://floreria-girasoles.lovable.app/",
          logo: "https://floreria-girasoles.lovable.app/logo-girasoles.png",
          image: "https://floreria-girasoles.lovable.app/logo-girasoles.png",
          areaServed: { "@type": "City", name: "Durango" },
          address: { "@type": "PostalAddress", addressLocality: "Durango", addressCountry: "MX" },
        }),
      },
    ],
  }),
});

function Index() {
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const { products, loading } = useProducts();

  const filtered = useMemo(() => {
    return selectedCategory === "all"
      ? products.slice(0, 12)
      : products.filter((p) => p.category === selectedCategory).slice(0, 12);
  }, [products, selectedCategory]);

  const featured = useMemo(() => products.slice(0, 4), [products]);

  return (
    <div>
      <HeroSection />

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-10">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-5 max-w-3xl mx-auto">
          {[
            { icon: Truck, title: "Entrega Puntual", desc: "En todo Durango" },
            { icon: Shield, title: "Pago Seguro", desc: "100% protegido" },
            { icon: Heart, title: "Hecho a Mano", desc: "Con amor y dedicación" },
          ].map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass-card p-3 sm:p-5 text-center"
            >
              <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-primary mx-auto mb-1.5 sm:mb-2" />
              <p className="font-medium text-foreground text-[11px] sm:text-sm leading-tight">{title}</p>
              <p className="text-muted-foreground text-[9px] sm:text-xs mt-0.5 leading-tight hidden xs:block sm:block">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section id="destacados" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
        <div className="text-center mb-8 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-px w-6 sm:w-8 bg-primary/40" />
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              <span className="text-primary font-medium text-[10px] sm:text-xs uppercase tracking-[0.25em]">Lo más vendido</span>
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              <div className="h-px w-6 sm:w-8 bg-primary/40" />
            </div>
            <h2 className="section-heading text-2xl sm:text-4xl md:text-5xl">Arreglos Destacados</h2>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base max-w-lg mx-auto px-4">
              Nuestros clientes los eligen una y otra vez por su belleza y calidad
            </p>
          </motion.div>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Full Catalog Preview */}
      <section className="relative py-12 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/40 to-background" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-14"
          >
            <h2 className="section-heading text-2xl sm:text-4xl md:text-5xl mb-3">Nuestro Catálogo</h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto px-4">
              Encuentra el arreglo perfecto para cada ocasión.
            </p>
          </motion.div>

          <div className="mb-6 sm:mb-8">
            <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}

          <div className="text-center mt-10 sm:mt-16">
            <Link to="/catalogo" className="btn-primary text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5">
              Ver Catálogo Completo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
