import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const products = await sql`SELECT id, slug, name, description, regular_price, sale_price FROM products WHERE is_active = true ORDER BY created_at DESC LIMIT 1`;
    if (!products.length) return NextResponse.json({ product: null, variants: [], images: [] });
    const product = products[0];
    const [variants, images] = await Promise.all([
      sql`SELECT id, color_name, color_hex, size, stock_quantity FROM product_variants WHERE product_id = ${product.id} ORDER BY color_name, size`,
      sql`SELECT id, image_url, alt_text, sort_order FROM product_images WHERE product_id = ${product.id} ORDER BY sort_order`
    ]);
    return NextResponse.json({ product, variants, images });
  } catch {
    return NextResponse.json({ error: "Catalogue indisponible" }, { status: 500 });
  }
}
