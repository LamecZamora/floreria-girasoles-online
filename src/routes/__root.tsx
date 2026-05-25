import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import OrderNotifications from "@/components/OrderNotifications";
import MfaGuard from "@/components/MfaGuard";
import { Toaster } from "@/components/ui/sonner";
import { prefetchProducts } from "@/hooks/useProducts";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground font-heading">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground font-heading">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o ha sido movida.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-primary">Ir al inicio</Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Florería Girasoles" },
      { name: "description", content: "Arreglos florales artesanales para cada momento especial" },
      { httpEquiv: "X-Content-Type-Options", content: "nosniff" },
      { name: "referrer", content: "strict-origin-when-cross-origin" },
      { httpEquiv: "Permissions-Policy", content: "camera=(), microphone=(), geolocation=(), payment=()" },
      { name: "format-detection", content: "telephone=no" },
      { name: "robots", content: "index, follow" },
      { name: "google-site-verification", content: "LMyHO2f-4XOTZ6m9JBd_DjR0D1DuhnlSyPDvfq-CetI" },
      { property: "og:title", content: "Florería Girasoles" },
      { name: "twitter:title", content: "Florería Girasoles" },
      { property: "og:description", content: "Arreglos florales artesanales para cada momento especial" },
      { name: "twitter:description", content: "Arreglos florales artesanales para cada momento especial" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c71d9071-14a2-4db1-9e4c-62980025ed17/id-preview-989a6637--3fb80125-d289-4e94-8021-71c4300fb3b4.lovable.app-1776484561615.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c71d9071-14a2-4db1-9e4c-62980025ed17/id-preview-989a6637--3fb80125-d289-4e94-8021-71c4300fb3b4.lovable.app-1776484561615.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "shortcut icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://hrebeqkhkdiqxpjojxjs.supabase.co", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://hrebeqkhkdiqxpjojxjs.supabase.co" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const location = useLocation();

  useEffect(() => {
    // Kick off product fetch in parallel with the initial render so the
    // catalog/home are essentially instant once components mount.
    if (location.pathname === "/" || location.pathname.startsWith("/catalogo")) {
      prefetchProducts();
    }
  }, [location.pathname]);

  return (
    <AuthProvider>
      <CartProvider>
        <MfaGuard />
        {(location.pathname === "/pedidos" || location.pathname.startsWith("/admin")) && <OrderNotifications />}
        <Navbar />
        <CartDrawer />
        <main className="min-h-screen">
          <Outlet />
        </main>
        <Footer />
        <WhatsAppButton />
        <Toaster position="top-right" richColors closeButton />
      </CartProvider>
    </AuthProvider>
  );
}
