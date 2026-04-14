import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Star } from "lucide-react";
import heroImage from "@/assets/hero-floreria.jpg";
import { motion } from "framer-motion";

const HeroSection = () => (
  <section className="relative min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] flex items-center overflow-hidden">
    <img
      src={heroImage}
      alt="Arreglos florales artesanales de Florería Girasoles"
      className="absolute inset-0 w-full h-full object-cover"
      width={1920}
      height={768}
      loading="eager"
      fetchPriority="high"
    />
    {/* Elegant dark overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.15_0.02_50/0.88)] via-[oklch(0.15_0.02_50/0.65)] to-[oklch(0.15_0.02_50/0.25)]" />
    <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.15_0.02_50/0.4)] to-transparent" />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-gold/20 backdrop-blur-md border border-gold/30 rounded-full px-4 py-1.5 mb-6"
        >
          <Star className="h-3.5 w-3.5 text-gold fill-gold" />
          <span className="text-[oklch(0.95_0.005_85)] text-xs sm:text-sm font-medium tracking-wide">
            Arreglos artesanales desde 2015
          </span>
        </motion.div>

        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[oklch(0.98_0.005_85)] leading-[1.05] mb-5">
          Florería{" "}
          <span className="text-gold italic">Girasoles</span>
        </h1>

        <p className="text-[oklch(0.85_0.01_85)] text-base sm:text-lg md:text-xl mb-8 leading-relaxed max-w-lg font-light">
          Creamos arreglos florales únicos para cada momento especial de tu vida.
          Bodas, XV años, cumpleaños y más.
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          <Link to="/catalogo" className="btn-gold">
            Ver Catálogo <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#destacados" className="btn-outline-light hidden sm:inline-flex">
            Destacados
          </a>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-[oklch(0.15_0.02_50/0.5)] backdrop-blur-md border border-[oklch(0.98_0.005_85/0.12)] text-[oklch(0.90_0.005_85)] rounded-xl px-4 py-2.5 text-xs sm:text-sm"
        >
          <Clock className="h-4 w-4 text-gold flex-shrink-0" />
          <span>
            Pedidos con al menos <strong className="text-[oklch(0.95_0.005_85)]">10 días</strong> de anticipación
          </span>
        </motion.div>
      </motion.div>
    </div>

    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
  </section>
);

export default HeroSection;
