"use client";

import { MeatCut } from "@/types";

export function CutDetailModal({
  cut,
  onClose,
}: {
  cut: MeatCut | null;
  onClose: () => void;
}) {
  if (!cut) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-brand-ink/65 md:items-center md:justify-center">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-soft md:max-w-2xl md:rounded-[2rem]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-brand-clay">{cut.category}</p>
            <h2 className="mt-2 font-display text-4xl text-brand-ink">{cut.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-clay/15 px-4 py-2 text-sm font-semibold text-brand-ink"
          >
            Chiudi
          </button>
        </div>

        <div className="mt-6 grid gap-4 text-sm leading-7 text-brand-ink/80">
          <Detail label="Caratteristiche" value={cut.characteristics} />
          <Detail label="Storia e provenienza" value={cut.originStory} />
          <Detail label="Consiglio di cottura" value={cut.cookingMethod} />
          <Detail label="Tempo di cottura" value={cut.cookingTime} />
          <Detail label="Abbinamenti" value={cut.pairings} />
          <Detail label="Ideale per" value={cut.idealFor.join(", ")} />
          <Detail label="Consiglio Sapore di Carne" value={cut.advice} />
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-[#fff8f5] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-clay">{label}</p>
      <p className="mt-2">{value}</p>
    </div>
  );
}
