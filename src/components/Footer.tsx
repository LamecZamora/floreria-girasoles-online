import { Heart, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";

const Footer = () => (
  <footer className="bg-foreground text-primary-foreground mt-12 sm:mt-20">
    <div className="bg-background">
      <svg viewBox="0 0 1440 60" className="w-full h-8 sm:h-12 fill-foreground" preserveAspectRatio="none">
        <path d="M0,20 C360,60 720,0 1080,30 C1260,45 1380,25 1440,30 L1440,60 L0,60 Z" />
      </svg>
    </div>
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 pb-24 sm:pb-14">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
        <div className="sm:col-span-2 lg:col-span-1">
          <h3 className="font-heading text-xl sm:text-2xl font-bold mb-3">
            Florería <span className="text-primary">Girasoles</span>
          </h3>
          <p className="text-primary-foreground/60 text-sm leading-relaxed max-w-xs">
            Creamos arreglos florales únicos para cada ocasión especial.
            Desde bodas hasta cumpleaños, cada flor cuenta una historia.
          </p>
        </div>

        <div>
          <h4 className="font-heading text-base sm:text-lg font-semibold mb-3 sm:mb-4">Categorías</h4>
          <ul className="space-y-1.5 sm:space-y-2 text-sm text-primary-foreground/60">
            {["XV Años", "Bodas", "14 de Febrero", "Cumpleaños", "Graduaciones", "Día de las Madres", "Aniversarios", "Decoración"].map(cat => (
              <li key={cat}>
                <Link to="/catalogo" className="hover:text-primary transition-colors">{cat}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-heading text-base sm:text-lg font-semibold mb-3 sm:mb-4">Navegación</h4>
          <ul className="space-y-1.5 sm:space-y-2 text-sm text-primary-foreground/60">
            <li><Link to="/" className="hover:text-primary transition-colors">Inicio</Link></li>
            <li><Link to="/catalogo" className="hover:text-primary transition-colors">Catálogo</Link></li>
            <li><Link to="/faq" className="hover:text-primary transition-colors">Preguntas Frecuentes</Link></li>
            <li><Link to="/auth" className="hover:text-primary transition-colors">Mi Cuenta</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-heading text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contacto</h4>
          <ul className="space-y-2.5 sm:space-y-3 text-sm text-primary-foreground/60">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span>Belisario Domínguez 409, Barrio de Analco, 34138 Durango, Dgo.</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary flex-shrink-0" />
              <a href="tel:+526181169706" className="hover:text-primary transition-colors">+52 618 116 9706</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary flex-shrink-0" />
              <a href="mailto:contacto@floreriagirasoles.com" className="hover:text-primary transition-colors break-all">contacto@floreriagirasoles.com</a>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary flex-shrink-0" />
              Lun - Sáb: 9am - 7pm
            </li>
          </ul>
        </div>
      </div>

      {/* Google Maps — Durango, México */}
      <div className="mt-10 sm:mt-14">
        <h4 className="font-heading text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          ¿Dónde estamos?
        </h4>
        <div className="rounded-2xl overflow-hidden border border-primary-foreground/10 shadow-lg">
          <iframe
            title="Ubicación Florería Girasoles - Durango"
            src="https://www.google.com/maps?q=Belisario+Dom%C3%ADnguez+409,+Barrio+de+Analco,+34138+Durango,+Dgo&output=embed"
            width="100%"
            height="280"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>

      <div className="border-t border-primary-foreground/10 mt-8 sm:mt-12 pt-6 text-center text-xs sm:text-sm text-primary-foreground/40 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
        <span className="flex items-center gap-1">
          Hecho con <Heart className="h-3.5 w-3.5 text-accent fill-accent inline" /> por Florería Girasoles
        </span>
        <span className="hidden sm:inline">·</span>
        <span>© {new Date().getFullYear()} Todos los derechos reservados</span>
      </div>
    </div>
  </footer>
);

export default Footer;
