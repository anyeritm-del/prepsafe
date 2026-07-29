export interface LabelData {
  productName: string;
  preparedBy: string;
  preparedAt: Date;
  expiresAt: Date;
}

export interface ShelfLifePreset {
  label: string;
  /** Hours added to preparedAt to compute expiresAt. null means custom (manual entry). */
  hours: number | null;
}

export const SHELF_LIFE_PRESETS: ShelfLifePreset[] = [
  { label: "4 Jam", hours: 4 },
  { label: "1 Hari", hours: 24 },
  { label: "3 Hari", hours: 72 },
  { label: "5 Hari", hours: 120 },
  { label: "7 Hari", hours: 168 },
  { label: "Custom", hours: null },
];
