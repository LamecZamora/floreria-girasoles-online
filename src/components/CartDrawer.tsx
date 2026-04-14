import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CartDrawer = () => {
  const { items, removeItem, updateQuantity, total, isOpen, setIsOpen, clearCart } = useCart();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[oklch(0.15_0.02_50/0.5)] backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-card shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-border safe-top">
              <h2 className="font-heading text-xl font-semibold text-foreground flex items-center gap-3">
                <div className="p-2 bg-primary/8 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                Tu Carrito
                {items.length > 0 && (
                  <span className="text-xs bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full font-medium">
                    {items.length}
                  </span>
                )}
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-muted rounded-lg transition-all" aria-label="Cerrar carrito">
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center flex-col gap-4 text-muted-foreground px-6">
                <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
                  <ShoppingBag className="h-10 w-10 opacity-30" />
                </div>
                <p className="text-lg font-heading font-semibold text-foreground">Tu carrito está vacío</p>
                <p className="text-sm text-center">Agrega arreglos florales para empezar</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={item.product.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex gap-3 bg-muted/30 rounded-xl p-3 transition-all hover:bg-muted/50"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0 shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-foreground truncate">{item.product.name}</h4>
                          <p className="text-primary font-bold text-sm mt-1 font-heading">
                            ${(item.product.price * item.quantity).toLocaleString("es-MX")}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center bg-background rounded-lg border border-border overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="p-1.5 hover:bg-muted transition-colors"
                                aria-label="Reducir"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm font-medium w-7 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.product.id, Math.min(item.quantity + 1, item.product.stock))}
                                className="p-1.5 hover:bg-muted transition-colors"
                                aria-label="Aumentar"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="ml-auto p-1.5 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="border-t border-border p-5 space-y-3 safe-bottom bg-muted/15">
                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <span>Total:</span>
                    <span className="text-primary font-heading text-xl">${total.toLocaleString("es-MX")} MXN</span>
                  </div>
                  <button className="w-full btn-primary py-3.5">
                    Proceder al Pago <ArrowRight className="h-4 w-4" />
                  </button>
                  <button onClick={clearCart} className="w-full text-sm text-muted-foreground hover:text-destructive transition-colors py-1">
                    Vaciar carrito
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
