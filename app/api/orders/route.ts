import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { variantId, quantity, customerName, phone, city, address, notes } = body;
    if (!variantId || !Number.isInteger(quantity) || quantity < 1 || quantity > 10 || !customerName?.trim() || !phone?.trim() || !city?.trim() || !address?.trim()) return NextResponse.json({ error: "Informations de commande invalides" }, { status: 400 });
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`SELECT public.place_store_order(${variantId}::uuid, ${quantity}::integer, ${customerName.trim()}, ${phone.trim()}, ${city.trim()}, ${address.trim()}, ${String(notes || "").trim()}) AS result`;
    return NextResponse.json({ success: true, order: rows[0].result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("INSUFFICIENT_STOCK")) return NextResponse.json({ error: "Stock insuffisant pour cette couleur et cette taille." }, { status: 409 });
    if (message.includes("PRODUCT_UNAVAILABLE")) return NextResponse.json({ error: "Produit indisponible." }, { status: 404 });
    if (message.includes("INVALID_QUANTITY")) return NextResponse.json({ error: "Quantité invalide." }, { status: 400 });
    return NextResponse.json({ error: "Impossible d'enregistrer la commande. Réessayez." }, { status: 500 });
  }
}