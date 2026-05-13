# Sapore di Carne - Box Degustazione

Landing mono-prodotto con configuratore guidato per la Box Degustazione di Sapore di Carne.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Nodemailer con SMTP Aruba

## Avvio locale

1. Installa le dipendenze:

```bash
npm install
```

2. Crea il file `.env.local` partendo da `.env.local.example`.

3. Avvia il progetto:

```bash
npm run dev
```

4. Apri [http://localhost:3000](http://localhost:3000)

## Variabili ambiente

```bash
SMTP_HOST=smtps.aruba.it
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=indirizzo-email-aruba
SMTP_PASSWORD=password-email-aruba
LEAD_RECIPIENT_EMAIL=email-interna-destinazione
```

## Deploy

Compatibile con:

- Vercel
- Hosting Node.js con supporto Next.js
- Server dedicati o VPS con `next build` + `next start`

Ricorda di configurare in produzione le stesse variabili ambiente SMTP.
