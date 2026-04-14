import { ShoppingCart, Check } from "lucide-react";
import type { Product } from "@/data/products";
import { categoryLabels } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
  index?: number;
}

const categoryColors: Record<string, string> = {
  "xv-anos": "bg-rose-light text-accent",
  bodas: "bg-sage-light text-secondary",
  "14-febrero": "bg-rose-light text-accent",
  cumpleanos: "bg-muted text-primary",
  condolencias: "bg-muted text-muted-foreground",
  graduaciones: "bg-muted text-primary",
  "dia-de-las-madres": "bg-rose-light text-accent",
  aniversarios: "bg-rose-light text-accent",
  decoracion: "bg-sage-light text-secondary",
  nacimientos: "bg-muted text-primary",
};

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const isOutOfStock = product.stock <= 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="card-product group"
    >
      <div className="relative overflow-hidden aspect-[4/5]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width={768}
          height={960}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
          <span className={`badge-category backdrop-blur-md ${categoryColors[product.category] || "bg-muted/80 text-foreground"}`}>
            {categoryLabels[product.category]}
          </span>
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-destructive text-destructive-foreground px-5 py-2 rounded-xl font-bold text-sm shadow-lg">
              AGOTADO
            </span>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground mb-1 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-muted-foreground text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg sm:text-xl font-bold text-primary">
            ${product.price.toLocaleString("es-MX")}
          </span>
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            aria-label={`Agregar ${product.name} al carrito`}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-300 ${
              added
                ? "bg-secondary text-secondary-foreground shadow-md"
                : isOutOfStock
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:shadow-lg active:scale-95"
            }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" /> <span className="hidden sm:inline">Agregado</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" /> <span className="hidden sm:inline">Agregar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
