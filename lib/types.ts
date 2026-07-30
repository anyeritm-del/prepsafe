export interface LabelData {
  productName: string;
  preparedBy: string;
  preparedAt: Date;
  expiresAt: Date;
  /** e.g. "THAWING" when printed for a defrost prep mode instead of normal prep. */
  status: string | null;
}
