export type CutCategory = "top" | "premium" | "base";

export type BoxStatus =
  | "Da iniziare"
  | "In composizione"
  | "Quasi completa"
  | "Da correggere"
  | "Box completa";

export interface MeatCut {
  id: string;
  name: string;
  category: CutCategory;
  shortDescription: string;
  characteristics: string;
  originStory: string;
  cookingMethod: string;
  cookingTime: string;
  pairings: string;
  idealFor: string[];
  advice: string;
}

export interface BoxCategoryRule {
  category: CutCategory;
  label: string;
  requiredKg: number;
  minDistinctCuts: number;
  advisoryMessage: string;
}

export interface BoxFormat {
  id: "box-10" | "box-20";
  name: string;
  totalKg: number;
  price: number;
  recommendedFor: string;
  categoryRules: BoxCategoryRule[];
}

export interface CategoryProgress {
  category: CutCategory;
  label: string;
  requiredKg: number;
  selectedKg: number;
  remainingKg: number;
  distinctCuts: number;
  minDistinctCuts: number;
  isWeightComplete: boolean;
  isValid: boolean;
  progress: number;
  advisory: string;
}

export interface BoxSummary {
  selectedBox: BoxFormat | null;
  totalSelectedKg: number;
  progressByCategory: Record<CutCategory, CategoryProgress>;
  selectedCuts: Array<MeatCut & { selectedKg: number }>;
  status: BoxStatus;
  isValid: boolean;
}

export interface LeadFormValues {
  name: string;
  phone: string;
  email: string;
  city: string;
  province: string;
  callbackWindow: string;
  notes: string;
  privacyConsent: boolean;
  website: string;
}

export interface LeadPayload {
  customer: LeadFormValues;
  boxId: BoxFormat["id"];
  boxName: string;
  price: number;
  status: BoxStatus;
  totalSelectedKg: number;
  categoryTotals: Record<CutCategory, number>;
  selectedCuts: Array<{
    id: string;
    name: string;
    category: CutCategory;
    selectedKg: number;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  fieldErrors: Partial<Record<keyof LeadFormValues | "box", string>>;
}
