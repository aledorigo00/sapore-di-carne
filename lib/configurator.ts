import { BOX_FORMATS } from "@/data/boxes";
import { MEAT_CUTS } from "@/data/cuts";
import {
  BoxFormat,
  BoxStatus,
  BoxSummary,
  CategoryProgress,
  CutCategory,
  MeatCut,
} from "@/types";

export const KG_STEP = 0.5;

export function getBoxFormat(boxId: BoxFormat["id"] | null) {
  return BOX_FORMATS.find((box) => box.id === boxId) ?? null;
}

export function getCutsByCategory(category: CutCategory) {
  return MEAT_CUTS.filter((cut) => cut.category === category);
}

export function getSelectedKg(selection: Record<string, number>, cutId: string) {
  return selection[cutId] ?? 0;
}

export function roundKg(value: number) {
  return Math.round(value * 10) / 10;
}

function getCategoryAdvisory(progress: CategoryProgress): string {
  if (progress.isValid) {
    return `Hai completato ${progress.label.toLowerCase()}. Ora la box è ben bilanciata anche in questa categoria.`;
  }

  if (progress.isWeightComplete && progress.distinctCuts < progress.minDistinctCuts) {
    return "Per rendere la box piu varia, aggiungi almeno un altro taglio in questa categoria.";
  }

  if (progress.remainingKg > 0) {
    return `Ti manca ancora ${progress.remainingKg} kg di ${progress.label.toLowerCase()}.`;
  }

  return "Questa composizione mantiene il prezzo fisso e ti guida verso una degustazione completa.";
}

function getStatus(progressItems: CategoryProgress[], totalSelectedKg: number, totalRequiredKg: number): BoxStatus {
  if (totalSelectedKg === 0) {
    return "Da iniziare";
  }

  if (progressItems.every((item) => item.isValid)) {
    return "Box completa";
  }

  if (progressItems.some((item) => item.isWeightComplete && !item.isValid)) {
    return "Da correggere";
  }

  if (totalSelectedKg >= totalRequiredKg * 0.75) {
    return "Quasi completa";
  }

  return "In composizione";
}

export function buildBoxSummary(
  boxId: BoxFormat["id"] | null,
  selection: Record<string, number>,
): BoxSummary {
  const selectedBox = getBoxFormat(boxId);

  if (!selectedBox) {
    const emptyProgress = {
      top: emptyCategoryProgress("top", "Tagli top"),
      premium: emptyCategoryProgress("premium", "Tagli premium"),
      base: emptyCategoryProgress("base", "Tagli base"),
    };

    return {
      selectedBox: null,
      totalSelectedKg: 0,
      progressByCategory: emptyProgress,
      selectedCuts: [],
      status: "Da iniziare",
      isValid: false,
    };
  }

  const selectedCuts = MEAT_CUTS.filter((cut) => getSelectedKg(selection, cut.id) > 0).map((cut) => ({
    ...cut,
    selectedKg: getSelectedKg(selection, cut.id),
  }));

  const progressEntries = selectedBox.categoryRules.map((rule) => {
    const categoryCuts = selectedCuts.filter((cut) => cut.category === rule.category);
    const selectedKg = roundKg(categoryCuts.reduce((sum, cut) => sum + cut.selectedKg, 0));
    const remainingKg = Math.max(0, roundKg(rule.requiredKg - selectedKg));
    const distinctCuts = categoryCuts.length;
    const isWeightComplete = selectedKg === rule.requiredKg;
    const isValid = isWeightComplete && distinctCuts >= rule.minDistinctCuts;

    const progress: CategoryProgress = {
      category: rule.category,
      label: rule.label,
      requiredKg: rule.requiredKg,
      selectedKg,
      remainingKg,
      distinctCuts,
      minDistinctCuts: rule.minDistinctCuts,
      isWeightComplete,
      isValid,
      progress: Math.min(100, Math.round((selectedKg / rule.requiredKg) * 100)),
      advisory: "",
    };

    return [rule.category, { ...progress, advisory: getCategoryAdvisory(progress) }] as const;
  });

  const progressByCategory = Object.fromEntries(progressEntries) as Record<CutCategory, CategoryProgress>;
  const totalSelectedKg = roundKg(selectedCuts.reduce((sum, cut) => sum + cut.selectedKg, 0));
  const status = getStatus(Object.values(progressByCategory), totalSelectedKg, selectedBox.totalKg);
  const isValid = status === "Box completa";

  return {
    selectedBox,
    totalSelectedKg,
    progressByCategory,
    selectedCuts,
    status,
    isValid,
  };
}

function emptyCategoryProgress(category: CutCategory, label: string): CategoryProgress {
  return {
    category,
    label,
    requiredKg: 0,
    selectedKg: 0,
    remainingKg: 0,
    distinctCuts: 0,
    minDistinctCuts: 2,
    isWeightComplete: false,
    isValid: false,
    progress: 0,
    advisory: "Seleziona una box per iniziare la composizione guidata.",
  };
}

export function getCategoryLimit(boxId: BoxFormat["id"] | null, category: CutCategory) {
  const box = getBoxFormat(boxId);
  return box?.categoryRules.find((rule) => rule.category === category)?.requiredKg ?? 0;
}

export function canAdjustCut(
  boxId: BoxFormat["id"] | null,
  category: CutCategory,
  currentCategoryKg: number,
  nextCutKg: number,
) {
  const limit = getCategoryLimit(boxId, category);
  return nextCutKg >= 0 && currentCategoryKg <= limit && nextCutKg <= limit;
}

export function getNextSelection(
  boxId: BoxFormat["id"] | null,
  selection: Record<string, number>,
  cut: MeatCut,
  nextValue: number,
) {
  const limit = getCategoryLimit(boxId, cut.category);
  const currentCutKg = getSelectedKg(selection, cut.id);
  const categorySelectedKg = roundKg(
    MEAT_CUTS.filter((item) => item.category === cut.category).reduce(
      (sum, item) => sum + getSelectedKg(selection, item.id),
      0,
    ) - currentCutKg,
  );
  const proposedCategoryKg = roundKg(categorySelectedKg + nextValue);

  if (nextValue < 0 || proposedCategoryKg > limit) {
    return {
      nextSelection: selection,
      changed: false,
      message: `In ${cut.category === "top" ? "questa categoria" : `${cut.category} `}puoi arrivare fino a ${limit} kg. Restiamo entro l'equilibrio previsto per la box.`,
    };
  }

  return {
    nextSelection: {
      ...selection,
      [cut.id]: roundKg(nextValue),
    },
    changed: true,
    message: "",
  };
}
