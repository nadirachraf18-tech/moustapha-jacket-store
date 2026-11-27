# Moustapha Jacket Store

Standalone product landing page for the Moustapha Shop simili-cuir jacket.

## Offer
- Promotional price: 150 DH (regular price: 250 DH)
- Sizes: M, L, XL, XXL
- Colors: Camel, navy, kaki, chocolate, black
- Orders: WhatsApp

## Stack
- Next.js App Router + TypeScript
- Neon Postgres (separate project: `moustapha-jacket-store`)

## Run locally
1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `NEXT_PUBLIC_WHATSAPP_NUMBER` to the store WhatsApp number (international format, digits only).
5. Run `npm run dev`.

## Product photos
Add approved product photos under `public/products` and replace the visual placeholder in `app/page.tsx` with the product gallery.

## Implementation status
The storefront frontend starter is committed. The Neon schema, secure admin authentication, stock/order APIs, and deployment are not yet configured. Keep `DATABASE_URL` server-side only; never expose privileged database credentials in browser code.
