import { Heart, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";

const Footer = () => (
  <footer className="relative bg-foreground text-[oklch(0.90_0.01_85)] mt-16 sm:mt-24">
    {/* Elegant wave */}
    <div className="bg-background">
      <svg viewBox="0 0 1440 48" className="w-full h-8 sm:h-12 fill-foreground" preserveAspectRatio="none">
        <path d="M0,16 C480,48 960,0 1440,24 L1440,48 L0,48 Z" />
      </svg>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12">
        <div className="sm:col-span-2 lg:col-span-1">
          <h3 className="font-heading text-2xl font-semibold text-[oklch(0.98_0.005_85)] mb-3 tracking-tight">
            Florería <span className="text-gold italic">Girasoles</span>
          </h3>
          <p className="text-sm leading-relaxed opacity-60 max-w-xs">
            Creamos arreglos florales únicos para cada ocasión especial.
            Desde bodas hasta cumpleaños, cada flor cuenta una historia.
          </p>
        </div>

        <div>
          <h4 className="font-heading text-lg font-semibold text-[oklch(0.98_0.005_85)] mb-4">Categorías</h4>
          <ul className="space-y-2.5 text-sm opacity-60">
            {["XV Años", "Bodas", "14 de Febrero", "Cumpleaños", "Graduaciones", "Día de las Madres", "Aniversarios", "Decoración"].map(
              (cat) => (
                <li key={cat}>
                  <Link to="/catalogo" className="hover:text-gold hover:opacity-100 transition-all">
                    {cat}
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>

        <div>
          <h4 className="font-heading text-lg font-semibold text-[oklch(0.98_0.005_85)] mb-4">Navegación</h4>
          <ul className="space-y-2.5 text-sm opacity-60">
            <li>
              <Link to="/" className="hover:text-gold hover:opacity-100 transition-all">Inicio</Link>
            </li>
            <li>
              <Link to="/catalogo" className="hover:text-gold hover:opacity-100 transition-all">Catálogo</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-heading text-lg font-semibold text-[oklch(0.98_0.005_85)] mb-4">Contacto</h4>
          <ul className="space-y-3 text-sm opacity-60">
            <li className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-gold flex-shrink-0" />
              Ciudad de México
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-gold flex-shrink-0" />
              (55) 1234-5678
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-gold flex-shrink-0" />
              contacto@floreriagirasoles.com
            </li>
            <li className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-gold flex-shrink-0" />
              Lun - Sáb: 9am - 7pm
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[oklch(0.98_0.005_85/0.08)] mt-10 pt-6 text-center text-xs opacity-40 flex flex-col sm:flex-row items-center justify-center gap-2">
        <span className="flex items-center gap-1">
          Hecho con <Heart className="h-3 w-3 text-rose fill-rose inline" /> por Florería Girasoles
        </span>
        <span className="hidden sm:inline">·</span>
        <span>© {new Date().getFullYear()} Todos los derechos reservados</span>
      </div>
    </div>
  </footer>
);

export default Footer;
