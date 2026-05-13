import nodemailer from "nodemailer";
import { LeadPayload } from "@/types";

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function createTransporter() {
  return nodemailer.createTransport({
    host: getEnv("SMTP_HOST"),
    port: Number(getEnv("SMTP_PORT")),
    secure: getEnv("SMTP_SECURE") === "true",
    auth: {
      user: getEnv("SMTP_USER"),
      pass: getEnv("SMTP_PASSWORD"),
    },
  });
}

export function buildLeadEmailHtml(payload: LeadPayload, userAgent?: string | null) {
  const submittedAt = new Intl.DateTimeFormat("it-IT", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  }).format(new Date());

  const cutsList = payload.selectedCuts
    .map(
      (cut) =>
        `<li><strong>${cut.name}</strong> (${cut.category}) - ${cut.selectedKg.toFixed(1)} kg</li>`,
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #241410; line-height: 1.6;">
      <h1 style="margin-bottom: 12px;">Nuova configurazione Box Degustazione - Sapore di Carne</h1>
      <h2 style="margin-bottom: 8px;">Dati cliente</h2>
      <ul>
        <li><strong>Nome:</strong> ${payload.customer.name}</li>
        <li><strong>Telefono:</strong> ${payload.customer.phone}</li>
        <li><strong>Email:</strong> ${payload.customer.email || "Non indicata"}</li>
        <li><strong>Citta:</strong> ${payload.customer.city}</li>
        <li><strong>Provincia:</strong> ${payload.customer.province}</li>
        <li><strong>Fascia oraria preferita:</strong> ${payload.customer.callbackWindow || "Non indicata"}</li>
        <li><strong>Note:</strong> ${payload.customer.notes || "Nessuna nota"}</li>
      </ul>

      <h2 style="margin-bottom: 8px;">Dati box</h2>
      <ul>
        <li><strong>Formato scelto:</strong> ${payload.boxName}</li>
        <li><strong>Prezzo fisso:</strong> EUR ${payload.price}</li>
        <li><strong>Stato validazione:</strong> ${payload.status}</li>
        <li><strong>Totale kg top:</strong> ${payload.categoryTotals.top.toFixed(1)} kg</li>
        <li><strong>Totale kg premium:</strong> ${payload.categoryTotals.premium.toFixed(1)} kg</li>
        <li><strong>Totale kg base:</strong> ${payload.categoryTotals.base.toFixed(1)} kg</li>
        <li><strong>Totale kg complessivi:</strong> ${payload.totalSelectedKg.toFixed(1)} kg</li>
      </ul>
      <p><strong>Tagli selezionati:</strong></p>
      <ul>${cutsList}</ul>

      <h2 style="margin-bottom: 8px;">Dati tecnici</h2>
      <ul>
        <li><strong>Data e ora invio:</strong> ${submittedAt}</li>
        <li><strong>User agent:</strong> ${userAgent || "Non disponibile"}</li>
      </ul>
    </div>
  `;
}
