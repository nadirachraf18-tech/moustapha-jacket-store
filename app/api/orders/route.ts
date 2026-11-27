import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { variantId, quantity, customerName, phone, city, address, notes } = body;
    if (!variantId || !Number.isInteger(quantity) || quantity < 1 || quantity > 10 ||
        !customerName?.trim() || !phone?.trim() || !city?.trim() || !address?.trim()) {
      return NextResponse.json({ error: "Informations de commande invalides" }, { status: 400 });
    }
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      UPDATE product_variants SET stock_quantity = stock_quantity - ${quantity}, updated_at = now()
      WHERE id = ${variantId} AND stock_quantity >= ${quantity}
      RETURNING id, color_name, size
    `;
    if (!rows.length) return NextResponse.json({ error: "Stock insuffisant pour cette variante" }, { status: 409 });
    const variant = rows[0];
    const productRows = await sql`SELECT name, sale_price FROM products WHERE is_active = true ORDER BY created_at DESC LIMIT 1`;
    if (!productRows.length) {
      await sql`UPDATE product_variants SET stock_quantity = stock_quantity + ${quantity} WHERE id = ${variantId}`;
      return NextResponse.json({ error: "Produit indisponible" }, { status: 404 });
    }
    const product = productRows[0];
    const subtotal = Number(product.sale_price) * quantity;
    const setting = await sql`SELECT value FROM store_settings WHERE key = 'delivery_fees'`;
    const fees = setting[0]?.value || {};
    const deliveryFee = Number(city.trim().toLowerCase() === "casablanca" ? fees.casablanca ?? 20 : fees.other_cities ?? 35);
    const total = subtotal + deliveryFee;
    const orderRows = await sql`
      INSERT INTO orders (customer_name, phone, city, address, notes, subtotal, delivery_fee, total)
      VALUES (${customerName.trim()}, ${phone.trim()}, ${city.trim()}, ${address.trim()}, ${String(notes || "").trim()}, ${subtotal}, ${deliveryFee}, ${total})
      RETURNING id, order_number, total
    `;
    const order = orderRows[0];
    await sql`
      INSERT INTO order_items (order_id, variant_id, product_name, color_name, size, unit_price, quantity, line_total)
      VALUES (${order.id}, ${variant.id}, ${product.name}, ${variant.color_name}, ${variant.size}, ${product.sale_price}, ${quantity}, ${subtotal})
    `;
    return NextResponse.json({ success: true, order });
  } catch {
    return NextResponse.json({ error: "Impossible d'enregistrer la commande. Réessayez." }, { status: 500 });
  }
}
