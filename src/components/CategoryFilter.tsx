import type { Category } from "@/data/products";
import { categoryLabels } from "@/data/products";
import { useRef, useEffect } from "react";

interface CategoryFilterProps {
  selected: Category | "all";
  onSelect: (cat: Category | "all") => void;
}

const categoryEmojis: Record<string, string> = {
  all: "✨",
  "14-febrero": "💕",
  bodas: "💒",
  "xv-anos": "👑",
  cumpleanos: "🎂",
  condolencias: "🕊️",
  graduaciones: "🎓",
  "dia-de-las-madres": "👩",
  aniversarios: "💍",
  decoracion: "🏠",
  nacimientos: "👶",
};

const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  const categories: Array<Category | "all"> = [
    "all", "14-febrero", "bodas", "xv-anos", "cumpleanos", "condolencias",
    "graduaciones", "dia-de-las-madres", "aniversarios", "decoracion", "nacimientos",
  ];
  const labels: Record<string, string> = { all: "Todos", ...categoryLabels };
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = selectedRef.current;
      const scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [selected]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 px-4 -mx-4 sm:px-1 sm:-mx-1 snap-x snap-mandatory md:flex-wrap md:justify-center md:overflow-visible md:pb-0 md:px-0 md:mx-0"
    >
      {categories.map((cat) => (
        <button
          key={cat}
          ref={selected === cat ? selectedRef : undefined}
          onClick={() => onSelect(cat)}
          className={`flex-shrink-0 snap-start flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap border active:scale-95 ${
            selected === cat
              ? "bg-primary text-primary-foreground border-primary shadow-[0_4px_16px_-4px_oklch(0.38_0.08_160/0.3)]"
              : "bg-card text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground"
          }`}
        >
          <span className="text-sm">{categoryEmojis[cat]}</span>
          {labels[cat]}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
