import { BOX_FORMATS } from "@/data/boxes";
import { buildBoxSummary } from "@/lib/configurator";
import { LeadFormValues, ValidationResult } from "@/types";

const phonePattern = /^[0-9+\s]{7,20}$/;

export function validateLeadForm(
  values: LeadFormValues,
  boxId: "box-10" | "box-20" | null,
  selection: Record<string, number>,
): ValidationResult {
  const summary = buildBoxSummary(boxId, selection);
  const fieldErrors: ValidationResult["fieldErrors"] = {};

  if (!values.name.trim()) {
    fieldErrors.name = "Inserisci il tuo nome per poterti richiamare.";
  }

  if (!values.phone.trim()) {
    fieldErrors.phone = "Lasciaci un numero di telefono per confermare la box.";
  } else if (!phonePattern.test(values.phone.trim())) {
    fieldErrors.phone = "Controlla il numero: deve contenere solo cifre, spazi o il simbolo +.";
  }

  if (values.email.trim() && !/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    fieldErrors.email = "L'email inserita non sembra corretta.";
  }

  if (!values.city.trim()) {
    fieldErrors.city = "Indica la citta in cui desideri ricevere la box.";
  }

  if (!values.province.trim()) {
    fieldErrors.province = "Aggiungi la provincia per aiutarci con la consegna.";
  }

  if (!values.privacyConsent) {
    fieldErrors.privacyConsent = "Serve il consenso privacy per poterti ricontattare.";
  }

  if (!boxId || !BOX_FORMATS.some((box) => box.id === boxId) || !summary.isValid) {
    fieldErrors.box = "Completa correttamente la box prima di inviare la richiesta.";
  }

  if (values.website.trim()) {
    fieldErrors.website = "Segnalazione anti-spam attivata.";
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
}
