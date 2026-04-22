export type Category =
  | "xv-anos"
  | "bodas"
  | "14-febrero"
  | "cumpleanos"
  | "condolencias"
  | "graduaciones"
  | "dia-de-las-madres"
  | "aniversarios"
  | "decoracion"
  | "nacimientos";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  category: Category;
}

export const categoryLabels: Record<Category, string> = {
  "14-febrero": "14 de Febrero",
  bodas: "Bodas",
  "xv-anos": "XV Años",
  cumpleanos: "Cumpleaños",
  condolencias: "Condolencias",
  graduaciones: "Graduaciones",
  "dia-de-las-madres": "Día de las Madres",
  aniversarios: "Aniversarios",
  decoracion: "Decoración",
  nacimientos: "Nacimientos",
};