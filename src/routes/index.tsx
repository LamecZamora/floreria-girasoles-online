import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { mockProducts, type Category } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import CategoryFilter from "@/components/CategoryFilter";
import HeroSection from "@/components/HeroSection";
import { Sparkles, ArrowRight, Truck, Shield, Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Florería Girasoles - Arreglos Florales Artesanales" },
      { name: "description", content: "Creamos arreglos florales únicos para cada momento especial. Bodas, XV años, cumpleaños y más en Durango, México." },
      { property: "og:title", content: "Florería Girasoles - Arreglos Florales Artesanales" },
      { property: "og:description", content: "Creamos arreglos florales únicos para cada momento especial." },
    ],
  }),
});

function Index() {
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");

  const filtered =
    selectedCategory === "all"
      ? mockProducts.slice(0, 12)
      : mockProducts.filter((p) => p.category === selectedCategory).slice(0, 12);

  const featured = mockProducts.slice(0, 4);

  return (
    <div>
      <HeroSection />

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 relative z-10">
        <div className="grid grid-cols-3 gap-3 sm:gap-5 max-w-3xl mx-auto">
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
              className="glass-card p-4 sm:p-5 text-center"
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-2" />
              <p className="font-medium text-foreground text-xs sm:text-sm">{title}</p>
              <p className="text-muted-foreground text-[10px] sm:text-xs mt-0.5">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section id="destacados" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-10 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-px w-8 bg-gold" />
              <Sparkles className="h-4 w-4 text-gold" />
              <span className="text-gold font-medium text-xs uppercase tracking-[0.25em]">Lo más vendido</span>
              <Sparkles className="h-4 w-4 text-gold" />
              <div className="h-px w-8 bg-gold" />
            </div>
            <h2 className="section-heading text-3xl sm:text-4xl md:text-5xl">Arreglos Destacados</h2>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base max-w-lg mx-auto">
              Nuestros clientes los eligen una y otra vez por su belleza y calidad
            </p>
          </motion.div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </section>

      {/* Full Catalog Preview */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/40 to-background" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-14"
          >
            <h2 className="section-heading text-3xl sm:text-4xl md:text-5xl mb-3">Nuestro Catálogo</h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              Encuentra el arreglo perfecto para cada ocasión. Filtra por categoría.
            </p>
          </motion.div>

          <div className="mb-8">
            <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>

          <div className="text-center mt-12 sm:mt-16">
            <Link to="/catalogo" className="btn-primary text-base px-8 py-3.5">
              Ver Catálogo Completo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
