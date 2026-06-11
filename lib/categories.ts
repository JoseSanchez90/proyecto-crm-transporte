export const SHIPMENT_CATEGORIES = [
  { value: "ELECTRONICA", label: "Electrónica" },
  { value: "MOBILIARIO", label: "Mobiliario" },
  { value: "ROPA", label: "Ropa" },
  { value: "ALIMENTOS", label: "Alimentos" },
  { value: "MAQUINARIA", label: "Maquinaria" },
  { value: "OTROS", label: "Otros" },
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  ELECTRONICA: "Electrónica",
  MOBILIARIO: "Mobiliario",
  ROPA: "Ropa",
  ALIMENTOS: "Alimentos",
  MAQUINARIA: "Maquinaria",
  OTROS: "Otros",
};
