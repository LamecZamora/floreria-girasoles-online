import { Link, useLocation } from "@tanstack/react-router";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState, useEffect } from "react";
import logo from "@/assets/logo-girasoles.png";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const { itemCount, setIsOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-500 safe-top ${
        scrolled
          ? "bg-card/95 backdrop-blur-xl shadow-[0_1px_20px_-6px_oklch(0.22_0.02_50/0.1)] border-b border-border/60"
          : "bg-card/70 backdrop-blur-md border-b border-border/30"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 min-w-0" onClick={() => setMobileOpen(false)}>
          <img
            src={logo}
            alt="Florería Girasoles"
            className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 rounded-full shadow-sm ring-2 ring-primary/10"
          />
          <div className="flex flex-col">
            <span className="font-heading text-lg sm:text-xl font-semibold text-foreground leading-tight tracking-tight">
              Florería <span className="text-primary">Girasoles</span>
            </span>
            <span className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase hidden sm:block">
              Arreglos artesanales
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <NavItem to="/" label="Inicio" active={location.pathname === "/"} />
          <NavItem to="/catalogo" label="Catálogo" active={location.pathname === "/catalogo"} />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2.5 rounded-xl hover:bg-muted/80 transition-all group"
            aria-label="Abrir carrito"
          >
            <ShoppingCart className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
            {itemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 bg-rose text-rose-foreground text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md"
              >
                {itemCount > 99 ? "99+" : itemCount}
              </motion.span>
            )}
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2.5 rounded-xl hover:bg-muted/80 transition-all"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 top-[61px] z-40 bg-card/98 backdrop-blur-lg"
          >
            <div className="flex flex-col h-full px-6 py-8 gap-2">
              <MobileLink to="/" onClick={() => setMobileOpen(false)} active={location.pathname === "/"}>
                Inicio
              </MobileLink>
              <MobileLink to="/catalogo" onClick={() => setMobileOpen(false)} active={location.pathname === "/catalogo"}>
                Catálogo
              </MobileLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const NavItem = ({ to, label, active }: { to: string; label: string; active: boolean }) => (
  <Link
    to={to}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      active
        ? "text-primary bg-primary/8"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
    }`}
  >
    {label}
  </Link>
);

const MobileLink = ({
  to,
  onClick,
  children,
  active,
}: {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
  active: boolean;
}) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center py-4 px-5 rounded-xl font-heading text-2xl font-semibold transition-all ${
      active ? "text-primary bg-primary/8" : "text-foreground hover:bg-muted/50"
    }`}
  >
    {children}
  </Link>
);

export default Navbar;
