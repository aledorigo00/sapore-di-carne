"use client";

import Image from "next/image";
import type { FormEvent, HTMLInputTypeAttribute } from "react";
import { useMemo, useState } from "react";
import { BOX_FORMATS } from "@/data/boxes";
import {
  buildBoxSummary,
  getCutsByCategory,
  getNextSelection,
  getSelectedKg,
  KG_STEP,
  roundKg,
} from "@/lib/configurator";
import { validateLeadForm } from "@/lib/validation";
import { BoxFormat, CutCategory, LeadFormValues, MeatCut } from "@/types";
import { CutDetailModal } from "@/components/cut-detail-modal";
import { BrandLogo } from "@/components/brand-logo";

const initialFormValues: LeadFormValues = {
  name: "",
  phone: "",
  email: "",
  city: "",
  province: "",
  callbackWindow: "",
  notes: "",
  privacyConsent: false,
  website: "",
};

const categoryTheme = {
  top: "from-[#120c0c] to-[#b51217]",
  premium: "from-[#6d1f20] to-[#c94a4d]",
  base: "from-[#4d1517] to-[#8f2c31]",
};

const steps = [
  { id: 1, label: "Scegli la box", shortLabel: "Scegli la box" },
  { id: 2, label: "tagli base", shortLabel: "tagli base", category: "base" },
  { id: 3, label: "tagli premium", shortLabel: "tagli premium", category: "premium" },
  { id: 4, label: "tagli top", shortLabel: "tagli top", category: "top" },
  { id: 5, label: "invia configurazione", shortLabel: "invia configurazione" },
] as const;

type StepId = (typeof steps)[number]["id"];

const CATEGORY_STEP_ORDER: CutCategory[] = ["base", "premium", "top"];

const CUT_IMAGE_MAP: Record<string, string> = {
  filetto: "/cuts/filetto.jpg",
  costata: "/cuts/costata.jpg",
  picanha: "/cuts/picanha.jpg",
  controfiletto: "/cuts/controfiletto.jpg",
  tagliata: "/cuts/controfiletto.jpg",
  fesa: "/cuts/fesa.jpg",
  hamburger: "/cuts/hamburger.jpg",
  straccetti: "/cuts/straccetti.jpg",
  brasato: "/cuts/brasato.jpg",
  ossobuchi: "/cuts/ossobuchi.jpg",
  costine: "/cuts/costine.jpg",
  macinato: "/cuts/macinato.jpg",
  spezzatino: "/cuts/spezzatino.jpg",
  bollito: "/cuts/bollito.jpg",
  muscolo: "/cuts/muscolo.jpg",
  "polpa-magra": "/cuts/polpa-magra.jpg",
};

const BOX_PREVIEW_IMAGE = "/box-complessiva.jpg";

export function BoxExperience() {
  const [selectedBoxId, setSelectedBoxId] = useState<BoxFormat["id"] | null>(null);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [activeCut, setActiveCut] = useState<MeatCut | null>(null);
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [formValues, setFormValues] = useState<LeadFormValues>(initialFormValues);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LeadFormValues | "box", string>>>({});
  const [advisorNote, setAdvisorNote] = useState(
    "Scegli il formato piu adatto e ti accompagniamo nel bilanciamento perfetto della box.",
  );
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const summary = useMemo(() => buildBoxSummary(selectedBoxId, selection), [selectedBoxId, selection]);

  const baseReady = summary.progressByCategory.base.isValid;
  const premiumReady = summary.progressByCategory.premium.isValid;
  const topReady = summary.progressByCategory.top.isValid;
  const boxReady = Boolean(summary.selectedBox);
  const canSend = summary.isValid;

  const currentCategory =
    currentStep >= 2 && currentStep <= 4 ? CATEGORY_STEP_ORDER[currentStep - 2] : null;

  const handleSelectBox = (boxId: BoxFormat["id"]) => {
    setSelectedBoxId(boxId);
    setSelection({});
    setFieldErrors({});
    setSubmitState("idle");
    setCurrentStep(2);
    const box = BOX_FORMATS.find((item) => item.id === boxId);
    setAdvisorNote(
      box
        ? `Hai scelto ${box.name}. Partiamo subito dai tagli base per costruire una box concreta e ben distribuita.`
        : advisorNote,
    );
  };

  const handleKgChange = (cut: MeatCut, nextValue: number) => {
    const { nextSelection, changed, message } = getNextSelection(selectedBoxId, selection, cut, nextValue);

    if (!changed) {
      setAdvisorNote(message);
      return;
    }

    setSelection(nextSelection);
    setSubmitState("idle");
    setAdvisorNote(
      nextValue > getSelectedKg(selection, cut.id)
        ? `Ottima scelta: ${cut.name} entra in box con ${roundKg(nextValue).toFixed(1)} kg.`
        : `Ribilanciamo la box: ${cut.name} ora e impostato su ${roundKg(nextValue).toFixed(1)} kg.`,
    );
  };

  const isStepEnabled = (step: StepId) => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return boxReady;
      case 3:
        return baseReady;
      case 4:
        return baseReady && premiumReady;
      case 5:
        return canSend;
      default:
        return false;
    }
  };

  const goToStep = (step: StepId) => {
    if (isStepEnabled(step)) {
      setCurrentStep(step);
    }
  };

  const handleContinueFromCategory = () => {
    if (!currentCategory) {
      return;
    }

    const progress = summary.progressByCategory[currentCategory];

    if (!progress.isValid) {
      setAdvisorNote(
        `Completa prima ${progress.label.toLowerCase()}: ti servono ${progress.requiredKg.toFixed(1)} kg totali e almeno ${progress.minDistinctCuts} tagli diversi.`,
      );
      return;
    }

    const nextStep = currentStep + 1;
    if (nextStep <= 5) {
      setCurrentStep(nextStep as StepId);
    }

    if (nextStep === 3) {
      setAdvisorNote("Base completata. Ora passiamo ai premium per dare varietà e resa alla box.");
    } else if (nextStep === 4) {
      setAdvisorNote("Premium completati. Chiudiamo con i tagli top per il vero effetto wow.");
    } else if (nextStep === 5) {
      setAdvisorNote("La box è completa. Passiamo all'invio della configurazione.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateLeadForm(formValues, selectedBoxId, selection);
    setFieldErrors(validation.fieldErrors);

    if (!validation.isValid || !summary.selectedBox) {
      setSubmitState("error");
      return;
    }

    setSubmitState("submitting");

    const payload = {
      customer: formValues,
      boxId: summary.selectedBox.id,
      boxName: summary.selectedBox.name,
      price: summary.selectedBox.price,
      status: summary.status,
      totalSelectedKg: summary.totalSelectedKg,
      categoryTotals: {
        top: summary.progressByCategory.top.selectedKg,
        premium: summary.progressByCategory.premium.selectedKg,
        base: summary.progressByCategory.base.selectedKg,
      },
      selectedCuts: summary.selectedCuts.map((cut) => ({
        id: cut.id,
        name: cut.name,
        category: cut.category,
        selectedKg: cut.selectedKg,
      })),
    };

    try {
      const response = await fetch("/api/send-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Lead submission failed");
      }

      setSubmitState("success");
      setFieldErrors({});
      setAdvisorNote(
        "Abbiamo ricevuto la tua configurazione. Ti richiamiamo per confermare disponibilità, consigliarti eventuali ritocchi e completare l'ordine.",
      );
      setFormValues(initialFormValues);
    } catch {
      setSubmitState("error");
    }
  };

  const currentBottomProgress = (() => {
    if (currentStep === 1) {
      return {
        label: "Scelta box",
        value: boxReady ? 100 : 0,
        detail: boxReady ? "Box scelta, puoi proseguire." : "Scegli il formato per iniziare.",
      };
    }

    if (currentCategory) {
      const progress = summary.progressByCategory[currentCategory];
      return {
        label: progress.label,
        value: Math.min(100, Math.round((progress.selectedKg / progress.requiredKg) * 100)),
        detail: progress.isValid
          ? `${progress.label} completati.`
          : `Ti mancano ${progress.remainingKg.toFixed(1)} kg. Tagli diversi: ${progress.distinctCuts}/${progress.minDistinctCuts}.`,
      };
    }

    return {
      label: "Invio richiesta",
      value: canSend ? 100 : 0,
      detail: canSend ? "Configurazione pronta per l'invio." : "Completa prima tutti i tagli richiesti.",
    };
  })();

  const bottomNav = (() => {
    if (currentStep === 1) {
      return {
        backLabel: "",
        onBack: undefined,
        nextLabel: boxReady ? "Vai ai tagli base" : "Scegli una box",
        onNext: boxReady ? () => setCurrentStep(2) : undefined,
      };
    }

    if (currentCategory) {
      return {
        backLabel: "Indietro",
        onBack: () => setCurrentStep((currentStep - 1) as StepId),
        nextLabel: currentStep === 4 ? "Vai al riepilogo" : "Avanti",
        onNext: () => handleContinueFromCategory(),
      };
    }

    return {
      backLabel: "Indietro",
      onBack: () => setCurrentStep(4),
      nextLabel: "",
      onNext: undefined,
    };
  })();

  return (
    <>
      <main className="min-h-screen bg-brand-cream pb-32 text-brand-ink">
        {currentStep === 1 ? (
          <section className="overflow-hidden bg-grain-glow">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-20 lg:pt-14">
              <div className="animate-reveal text-center lg:text-left">
                <div className="mb-8 flex justify-center lg:justify-start">
                  <BrandLogo className="h-auto w-[16rem] sm:w-[22rem]" />
                </div>
                <div className="mb-5 inline-flex rounded-full border border-brand-clay/20 bg-white/85 px-4 py-2 text-sm font-medium text-brand-clay shadow-soft">
                  Carne selezionata, box guidata, ordine assistito
                </div>
                <h1 className="mx-auto max-w-3xl font-display text-5xl leading-tight text-brand-ink sm:text-6xl lg:mx-0">
                  Componi la tua Box Degustazione di carne friulana.
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-brand-ink/75 lg:mx-0">
                  Parti dal formato, poi compila i tagli in tre passaggi chiari: base, premium e top.
                  Il prezzo resta fisso, la composizione resta guidata.
                </p>
                <div className="mt-8 flex justify-center lg:justify-start">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="rounded-full bg-brand-ember px-7 py-4 text-center text-sm font-semibold text-brand-cream transition hover:-translate-y-0.5 hover:bg-brand-clay"
                  >
                    Inizia la configurazione
                  </button>
                </div>
              </div>

              <div className="animate-float">
                <div className="relative overflow-hidden rounded-[2.25rem] border border-brand-clay/15 bg-white p-3 shadow-soft">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem]">
                    <Image
                      src={BOX_PREVIEW_IMAGE}
                      alt="Anteprima Box Degustazione Sapore di Carne"
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 48vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section id="wizard" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="rounded-4xl border border-brand-clay/15 bg-white/70 p-4 shadow-soft backdrop-blur sm:p-6">
            <div className="grid gap-4 md:grid-cols-5">
              {steps.map((step) => {
                const isActive = currentStep === step.id;
                const isEnabled = isStepEnabled(step.id);

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToStep(step.id)}
                    className={`rounded-3xl border px-4 py-4 text-left transition ${
                      isActive ? "border-brand-ember bg-[#fff3f0]" : "border-brand-clay/10 bg-white"
                    } ${!isEnabled ? "cursor-not-allowed opacity-55" : "hover:border-brand-ember/35"}`}
                    disabled={!isEnabled}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                          isActive ? "bg-brand-ember text-white" : "bg-brand-sand text-brand-ink"
                        }`}
                      >
                        {step.id}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-brand-clay">Step {step.id}</p>
                        <p className="text-base font-semibold text-brand-ink">{step.shortLabel}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {currentStep === 1 ? (
              <section className="rounded-4xl border border-brand-clay/15 bg-white p-7 shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-clay">Step 1</p>
                <h2 className="mt-3 font-display text-4xl">Scegli la box.</h2>
                <p className="mt-4 max-w-2xl text-brand-ink/70">
                  Scegli il formato che vuoi comporre. Appena selezioni la box, entri subito nel primo
                  passaggio dei tagli: i base.
                </p>

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  {BOX_FORMATS.map((box) => (
                    <article
                      key={box.id}
                      className={`rounded-4xl border p-7 shadow-soft transition ${
                        selectedBoxId === box.id ? "border-brand-ember bg-[#fff3f0]" : "border-brand-clay/15 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm uppercase tracking-[0.18em] text-brand-clay">Box degustazione</p>
                          <h3 className="mt-2 font-display text-3xl">{box.totalKg} kg</h3>
                        </div>
                        <div className="rounded-full bg-brand-ember px-4 py-2 text-sm font-semibold text-brand-cream">
                          EUR {box.price}
                        </div>
                      </div>
                      <p className="mt-4 text-brand-ink/75">{box.recommendedFor}</p>
                      <ul className="mt-5 space-y-3 text-sm text-brand-ink/75">
                        {box.categoryRules.map((rule) => (
                          <li key={rule.category} className="rounded-2xl bg-brand-sand/35 px-4 py-3">
                            {rule.label}: {rule.requiredKg} kg, almeno {rule.minDistinctCuts} tagli diversi
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => handleSelectBox(box.id)}
                        className="mt-6 w-full rounded-full bg-brand-ink px-5 py-4 text-sm font-semibold text-brand-cream transition hover:-translate-y-0.5 hover:bg-brand-ember"
                      >
                        Scegli questa box
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {currentCategory ? (
              <CategoryStepSection
                category={currentCategory}
                themeClass={categoryTheme[currentCategory]}
                selection={selection}
                summary={summary}
                onChangeKg={handleKgChange}
                onOpenDetail={setActiveCut}
              />
            ) : null}

            {currentStep === 5 ? (
              <section className="space-y-8">
                <div className="rounded-4xl border border-brand-clay/15 bg-white p-7 shadow-soft">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-clay">Step 5</p>
                  <h2 className="mt-3 font-display text-4xl">Invia la configurazione.</h2>
                  <p className="mt-4 text-brand-ink/70">
                    La tua box è pronta. Rivedila qui sotto, poi inviaci i tuoi dati per la conferma finale.
                  </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="space-y-6">
                    <div className="overflow-hidden rounded-4xl border border-brand-clay/15 bg-white p-3 shadow-soft">
                      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem]">
                        <Image
                          src={BOX_PREVIEW_IMAGE}
                          alt="Anteprima complessiva della Box Degustazione"
                          fill
                          sizes="(max-width: 1024px) 100vw, 45vw"
                          className="object-cover"
                        />
                      </div>
                    </div>

                    <div className="rounded-4xl border border-brand-clay/15 bg-white p-6 shadow-soft">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-clay">
                        Riepilogo box
                      </p>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <SummaryMetric label="Formato scelto" value={summary.selectedBox?.name ?? "-"} />
                        <SummaryMetric
                          label="Prezzo fisso"
                          value={summary.selectedBox ? `EUR ${summary.selectedBox.price}` : "-"}
                        />
                        <SummaryMetric
                          label="Totale kg"
                          value={`${summary.totalSelectedKg.toFixed(1)} / ${summary.selectedBox?.totalKg.toFixed(1) ?? "0.0"} kg`}
                        />
                        <SummaryMetric label="Stato" value={summary.status} />
                      </div>
                      <ul className="mt-5 space-y-3">
                        {summary.selectedCuts.map((cut) => (
                          <li
                            key={cut.id}
                            className="flex items-center justify-between rounded-2xl bg-brand-sand/35 px-4 py-3 text-sm"
                          >
                            <span>{cut.name}</span>
                            <strong>{cut.selectedKg.toFixed(1)} kg</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="rounded-4xl border border-brand-clay/15 bg-white p-7 shadow-soft"
                  >
                      <div className="grid gap-5 md:grid-cols-2">
                        <Field
                          label="Nome e cognome"
                          name="name"
                          required
                          value={formValues.name}
                          error={fieldErrors.name}
                          onChange={(value) => setFormValues((current) => ({ ...current, name: value }))}
                        />
                        <Field
                          label="Telefono"
                          name="phone"
                          required
                          value={formValues.phone}
                          error={fieldErrors.phone}
                          onChange={(value) => setFormValues((current) => ({ ...current, phone: value }))}
                        />
                        <Field
                          label="Email"
                          name="email"
                          type="email"
                          value={formValues.email}
                          error={fieldErrors.email}
                          onChange={(value) => setFormValues((current) => ({ ...current, email: value }))}
                        />
                        <Field
                          label="Fascia oraria preferita"
                          name="callbackWindow"
                          value={formValues.callbackWindow}
                          placeholder="Es. 12:30 - 14:00"
                          onChange={(value) =>
                            setFormValues((current) => ({ ...current, callbackWindow: value }))
                          }
                        />
                        <Field
                          label="Città"
                          name="city"
                          required
                          value={formValues.city}
                          error={fieldErrors.city}
                          onChange={(value) => setFormValues((current) => ({ ...current, city: value }))}
                        />
                        <Field
                          label="Provincia"
                          name="province"
                          required
                          value={formValues.province}
                          error={fieldErrors.province}
                          onChange={(value) => setFormValues((current) => ({ ...current, province: value }))}
                        />
                      </div>

                      <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold text-brand-ink">Note</label>
                        <textarea
                          rows={4}
                          value={formValues.notes}
                          onChange={(event) =>
                            setFormValues((current) => ({ ...current, notes: event.target.value }))
                          }
                          className="w-full rounded-3xl border border-brand-clay/15 bg-[#fffaf6] px-4 py-3 outline-none transition focus:border-brand-clay/45"
                          placeholder="Preferenze, occasione d'uso, richieste particolari..."
                        />
                      </div>

                      <input
                        type="text"
                        name="website"
                        value={formValues.website}
                        onChange={(event) =>
                          setFormValues((current) => ({ ...current, website: event.target.value }))
                        }
                        className="hidden"
                        tabIndex={-1}
                        autoComplete="off"
                      />

                      <label className="mt-5 flex items-start gap-3 rounded-3xl bg-brand-sand/30 p-4 text-sm text-brand-ink/75">
                        <input
                          type="checkbox"
                          checked={formValues.privacyConsent}
                          onChange={(event) =>
                            setFormValues((current) => ({
                              ...current,
                              privacyConsent: event.target.checked,
                            }))
                          }
                          className="mt-1 h-4 w-4 rounded border-brand-clay/30"
                        />
                        <span>
                          Acconsento al trattamento dei dati per essere ricontattato in merito alla mia
                          configurazione box.
                        </span>
                      </label>
                      {fieldErrors.privacyConsent ? (
                        <p className="mt-2 text-sm text-[#9e4325]">{fieldErrors.privacyConsent}</p>
                      ) : null}
                      {fieldErrors.box ? <p className="mt-2 text-sm text-[#9e4325]">{fieldErrors.box}</p> : null}

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(4)}
                          className="rounded-full border border-brand-clay/20 bg-white px-6 py-3 text-sm font-semibold text-brand-ink"
                        >
                          Torna ai tagli top
                        </button>
                        <button
                          type="submit"
                          disabled={submitState === "submitting"}
                          className="rounded-full bg-brand-ember px-5 py-4 text-sm font-semibold text-brand-cream transition hover:-translate-y-0.5 hover:bg-brand-clay disabled:opacity-50"
                        >
                          {submitState === "submitting"
                            ? "Invio in corso..."
                            : "Invia configurazione e fatti richiamare"}
                        </button>
                      </div>

                      {submitState === "success" ? (
                        <p className="mt-4 rounded-3xl bg-[#edf6ea] px-4 py-3 text-sm text-[#2f5f2f]">
                          Abbiamo ricevuto la tua Box Degustazione. Ti richiamiamo per confermare
                          disponibilità, consigliarti eventuali modifiche e completare l&apos;ordine.
                        </p>
                      ) : null}

                      {submitState === "error" ? (
                        <p className="mt-4 rounded-3xl bg-[#fff0ea] px-4 py-3 text-sm text-[#9e4325]">
                          Non siamo riusciti a inviare la richiesta. Puoi riprovare oppure contattarci
                          direttamente su WhatsApp.
                        </p>
                      ) : null}
                  </form>
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </main>

      <BottomStepProgress
        title={currentBottomProgress.label}
        detail={currentBottomProgress.detail}
        progress={currentBottomProgress.value}
        backLabel={bottomNav.backLabel}
        onBack={bottomNav.onBack}
        nextLabel={bottomNav.nextLabel}
        onNext={bottomNav.onNext}
      />

      <CutDetailModal cut={activeCut} onClose={() => setActiveCut(null)} />
    </>
  );
}

function CategoryStepSection({
  category,
  themeClass,
  selection,
  summary,
  onChangeKg,
  onOpenDetail,
}: {
  category: CutCategory;
  themeClass: string;
  selection: Record<string, number>;
  summary: ReturnType<typeof buildBoxSummary>;
  onChangeKg: (cut: MeatCut, nextValue: number) => void;
  onOpenDetail: (cut: MeatCut) => void;
}) {
  const categoryCuts = getCutsByCategory(category);
  const categoryProgress = summary.progressByCategory[category];

  return (
    <section className="space-y-8">
      <div className="rounded-4xl border border-brand-clay/15 bg-white p-7 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-clay">
          Step {CATEGORY_STEP_ORDER.indexOf(category) + 2}
        </p>
        <h2 className="mt-3 font-display text-4xl">{categoryProgress.label}.</h2>
        <p className="mt-4 text-brand-ink/70">{categoryProgress.advisory}</p>
      </div>

      <section className="rounded-4xl border border-brand-clay/15 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div
              className={`inline-flex rounded-full bg-gradient-to-r px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cream ${themeClass}`}
            >
              {categoryProgress.label}
            </div>
            <h3 className="mt-4 font-display text-3xl">
              {categoryProgress.selectedKg.toFixed(1)} / {categoryProgress.requiredKg.toFixed(1)} kg
            </h3>
            <p className="mt-2 text-sm text-brand-ink/75">
              {categoryProgress.distinctCuts} tagli selezionati su almeno {categoryProgress.minDistinctCuts} richiesti.
            </p>
          </div>
          <div className="max-w-md">
            <div className="h-3 overflow-hidden rounded-full bg-brand-sand">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${themeClass} transition-all duration-300`}
                style={{ width: `${categoryProgress.progress}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-brand-ink/75">
              {categoryProgress.isValid
                ? "Step completato. Puoi continuare."
                : `Ti mancano ${categoryProgress.remainingKg.toFixed(1)} kg e almeno ${categoryProgress.minDistinctCuts} tagli diversi.`}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {categoryCuts.map((cut) => {
            const currentKg = getSelectedKg(selection, cut.id);
            const maxForCategory = categoryProgress.requiredKg;
            const canIncrease =
              summary.selectedBox && roundKg(categoryProgress.selectedKg + KG_STEP) <= maxForCategory;

            return (
              <article
                key={cut.id}
                className="rounded-[1.75rem] border border-brand-clay/10 bg-[#fff9f7] p-5"
              >
                <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-[1.4rem] bg-brand-sand/30">
                  <Image
                    src={CUT_IMAGE_MAP[cut.id] ?? "/cuts/filetto.jpg"}
                    alt={cut.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-brand-clay">{cut.category}</p>
                    <h4 className="mt-2 text-xl font-semibold text-brand-ink">{cut.name}</h4>
                  </div>
                  {currentKg > 0 ? (
                    <span className="rounded-full bg-brand-ember/10 px-3 py-1 text-xs font-semibold text-brand-ember">
                      {currentKg.toFixed(1)} kg
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 text-sm leading-7 text-brand-ink/75">
                  <p>
                    <span className="font-semibold text-brand-ink">Ideale per:</span>{" "}
                    {cut.idealFor.join(", ")}
                  </p>
                  <p className="mt-2 text-brand-ink/60">
                    <span className="font-semibold text-brand-ink">Cotture consigliate:</span>{" "}
                    {cut.cookingMethod}
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenDetail(cut)}
                    className="mt-3 block font-semibold text-brand-ember underline underline-offset-4"
                  >
                    Scopri il taglio
                  </button>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => onChangeKg(cut, roundKg(currentKg + KG_STEP))}
                    className="flex-1 rounded-full bg-brand-ember px-4 py-3 text-sm font-semibold text-brand-cream disabled:cursor-not-allowed disabled:opacity-35 hover:bg-brand-clay"
                    disabled={!canIncrease}
                  >
                    Aggiungi
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeKg(cut, roundKg(currentKg - KG_STEP))}
                    className="rounded-full border border-brand-ember px-4 py-3 text-sm font-semibold text-brand-ember disabled:cursor-not-allowed disabled:opacity-35"
                    disabled={currentKg <= 0}
                  >
                    Rimuovi
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function Field({
  label,
  name,
  value,
  error,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  error?: string;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-brand-ink">
        {label} {required ? "*" : ""}
      </span>
      <input
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-3xl border border-brand-clay/15 bg-[#fffaf6] px-4 py-3 outline-none transition focus:border-brand-clay/45"
      />
      {error ? <span className="mt-2 block text-sm text-[#9e4325]">{error}</span> : null}
    </label>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-brand-sand/25 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-clay">{label}</p>
      <p className="mt-2 text-base font-semibold text-brand-ink">{value}</p>
    </div>
  );
}

function BottomStepProgress({
  title,
  detail,
  progress,
  backLabel,
  onBack,
  nextLabel,
  onNext,
}: {
  title: string;
  detail: string;
  progress: number;
  backLabel: string;
  onBack?: () => void;
  nextLabel: string;
  onNext?: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-clay/10 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-clay">{title}</p>
            <p className="mt-1 text-sm text-brand-ink/75">{detail}</p>
          </div>
          <div className="w-full max-w-xl">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-brand-clay">
              <span>Avanzamento step</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-brand-sand">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-ember to-brand-clay transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {backLabel ? (
              <button
                type="button"
                onClick={onBack}
                className="rounded-full border border-brand-clay/20 bg-white px-5 py-3 text-sm font-semibold text-brand-ink"
              >
                {backLabel}
              </button>
            ) : null}
            {nextLabel ? (
              <button
                type="button"
                onClick={onNext}
                disabled={!onNext}
                className="rounded-full bg-brand-ember px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                {nextLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
