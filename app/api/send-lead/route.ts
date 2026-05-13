import { NextRequest, NextResponse } from "next/server";
import { buildLeadEmailHtml, createTransporter } from "@/lib/email";
import { buildBoxSummary } from "@/lib/configurator";
import { validateLeadForm } from "@/lib/validation";
import { LeadPayload } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as LeadPayload;

    const selection = Object.fromEntries(
      payload.selectedCuts.map((cut) => [cut.id, cut.selectedKg]),
    );

    const validation = validateLeadForm(payload.customer, payload.boxId, selection);
    const summary = buildBoxSummary(payload.boxId, selection);

    if (!validation.isValid || !summary.isValid) {
      return NextResponse.json(
        {
          message: "Configurazione non valida.",
          errors: validation.fieldErrors,
        },
        { status: 400 },
      );
    }

    const transporter = createTransporter();
    const recipient = process.env.LEAD_RECIPIENT_EMAIL;

    if (!recipient) {
      throw new Error("Missing LEAD_RECIPIENT_EMAIL");
    }

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: recipient,
      subject: "Nuova configurazione Box Degustazione - Sapore di Carne",
      html: buildLeadEmailHtml(payload, request.headers.get("user-agent")),
      replyTo: payload.customer.email || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Lead submission error", error);

    return NextResponse.json(
      {
        message:
          "Non siamo riusciti a inviare la richiesta. Puoi riprovare oppure contattarci direttamente su WhatsApp.",
      },
      { status: 500 },
    );
  }
}
