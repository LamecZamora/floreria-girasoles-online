import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Star } from "lucide-react";
import heroImage from "@/assets/hero-floreria.webp";
import { motion } from "framer-motion";

const HeroSection = () => (
  <section className="relative min-h-[60vh] sm:min-h-[65vh] md:min-h-[75vh] flex items-center overflow-hidden">
    <img
      src={heroImage}
      alt="Arreglos florales artesanales de Florería Girasoles"
      className="absolute inset-0 w-full h-full object-cover scale-105"
      width={1920}
      height={768}
      loading="eager"
      fetchPriority="high"
    />
    <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/65 to-foreground/30 sm:to-foreground/20" />
    <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-8 sm:py-0">
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
          className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-md border border-primary/30 rounded-full px-3 sm:px-4 py-1.5 mb-4 sm:mb-6"
        >
          <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary fill-primary" />
          <span className="text-primary-foreground/90 text-[11px] sm:text-sm font-medium">Arreglos artesanales desde 2015</span>
        </motion.div>

        <h1 className="font-heading text-[2rem] leading-[1.05] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary-foreground mb-3 sm:mb-5">
          Florería{" "}
          <span className="text-primary drop-shadow-lg">Girasoles</span>
        </h1>
        <p className="text-primary-foreground/85 text-sm sm:text-lg md:text-xl mb-5 sm:mb-8 leading-relaxed max-w-lg">
          Creamos arreglos florales únicos para cada momento especial de tu vida.
          Bodas, XV años, cumpleaños y más.
        </p>
        <div className="flex flex-wrap gap-3 mb-5 sm:mb-7">
          <Link to="/catalogo" className="btn-primary inline-flex items-center gap-2 text-sm sm:text-lg px-6 sm:px-7 py-3 sm:py-3.5">
            Ver Catálogo <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
          <a href="#destacados" className="btn-outline-light hidden sm:inline-flex items-center gap-2">
            Destacados
          </a>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-foreground/25 backdrop-blur-md border border-primary-foreground/15 text-primary-foreground rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-sm"
        >
          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
          <span>Pedidos con al menos <strong>10 días</strong> de anticipación</span>
        </motion.div>
      </motion.div>
    </div>

    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
  </section>
);

export default HeroSection;
