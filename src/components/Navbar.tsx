import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Menu, X, User, LogOut, Settings, ClipboardList } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import logo from "@/assets/logo-girasoles.png";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const { itemCount, setIsOpen } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleSignOut = async () => {
    setMobileOpen(false);
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-500 safe-top ${
        scrolled
          ? "bg-card/95 backdrop-blur-xl shadow-[0_1px_20px_-6px_oklch(0.78_0.16_80/0.15)] border-b border-border/60"
          : "bg-card/70 backdrop-blur-md border-b border-border/30"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 min-w-0" onClick={() => setMobileOpen(false)}>
          <img src={logo} alt="Florería Girasoles" className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 rounded-full shadow-sm" />
          <span className="font-heading text-lg sm:text-xl font-bold text-foreground truncate">
            Florería <span className="text-primary">Girasoles</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <NavItem to="/" label="Inicio" active={location.pathname === "/"} />
          <NavItem to="/catalogo" label="Catálogo" active={location.pathname === "/catalogo"} />
          {user && (
            <NavItem to="/pedidos" label="Pedidos" active={location.pathname === "/pedidos"} icon={<ClipboardList className="h-3.5 w-3.5" />} />
          )}
          {isAdmin && (
            <NavItem to="/admin" label="Admin" active={location.pathname === "/admin"} icon={<Settings className="h-3.5 w-3.5" />} />
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
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
                className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md"
              >
                {itemCount > 99 ? "99+" : itemCount}
              </motion.span>
            )}
          </button>

          {user ? (
            <div className="hidden sm:flex items-center gap-1">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="max-w-24 truncate">{user.user_metadata?.full_name || user.email}</span>
              </div>
              <button onClick={handleSignOut} className="p-2.5 rounded-xl hover:bg-muted/80 transition-all" title="Cerrar sesión" aria-label="Cerrar sesión">
                <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="hidden sm:inline-flex btn-primary text-sm py-2 px-5">
              Iniciar sesión
            </Link>
          )}

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
            className="md:hidden fixed inset-0 top-[57px] z-40 bg-card/98 backdrop-blur-lg"
          >
            <div className="flex flex-col h-full">
              <div className="flex-1 px-6 py-6 flex flex-col gap-1">
                <MobileLink to="/" onClick={() => setMobileOpen(false)} icon="🏠" active={location.pathname === "/"}>Inicio</MobileLink>
                <MobileLink to="/catalogo" onClick={() => setMobileOpen(false)} icon="🌻" active={location.pathname === "/catalogo"}>Catálogo</MobileLink>
                {user && (
                  <MobileLink to="/pedidos" onClick={() => setMobileOpen(false)} icon="📋" active={location.pathname === "/pedidos"}>Mis Pedidos</MobileLink>
                )}
                {isAdmin && (
                  <MobileLink to="/admin" onClick={() => setMobileOpen(false)} icon="⚙️" active={location.pathname === "/admin"}>Panel Admin</MobileLink>
                )}
              </div>
              <div className="px-6 pb-8 safe-bottom space-y-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl">
                      <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{user.user_metadata?.full_name || "Usuario"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all">
                      <LogOut className="h-4 w-4" /> Cerrar sesión
                    </button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setMobileOpen(false)} className="w-full btn-primary text-center block py-3.5">
                    Iniciar sesión
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const NavItem = ({ to, label, active, icon }: { to: string; label: string; active: boolean; icon?: React.ReactNode }) => (
  <Link
    to={to}
    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    }`}
  >
    {icon}
    {label}
  </Link>
);

const MobileLink = ({ to, onClick, icon, children, active }: { to: string; onClick: () => void; icon: string; children: React.ReactNode; active: boolean }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 py-4 px-4 rounded-2xl font-medium text-lg transition-all active:bg-muted ${
      active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
    }`}
  >
    <span className="text-xl">{icon}</span>
    {children}
  </Link>
);

export default Navbar;
