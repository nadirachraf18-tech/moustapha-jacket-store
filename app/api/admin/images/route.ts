import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const products = await sql`SELECT id FROM products WHERE is_active = true ORDER BY created_at DESC LIMIT 1`;
    if (!products.length) return NextResponse.json({ images: [] });
    const product = products[0];
    const images = await sql`SELECT id, image_url, alt_text, sort_order FROM product_images WHERE product_id = ${product.id} ORDER BY sort_order, created_at`;
    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ error: "Impossible de charger les photos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;
  try {
    const body = await request.json();
    const imageUrl = String(body.imageUrl || "");
    const altText = String(body.altText || "Veste simili cuir Moustapha Shop").slice(0, 180);
    if (!/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(imageUrl)) {
      return NextResponse.json({ error: "Format image invalide. Utilisez JPG, PNG ou WebP." }, { status: 400 });
    }
    if (imageUrl.length > 1_500_000) return NextResponse.json({ error: "Image trop volumineuse après compression. Choisissez une autre photo." }, { status: 413 });
    const sql = neon(process.env.DATABASE_URL!);
    const products = await sql`SELECT id FROM products WHERE is_active = true ORDER BY created_at DESC LIMIT 1`;
    if (!products.length) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    const product = products[0];
    const count = await sql`SELECT count(*)::int AS total FROM product_images WHERE product_id = ${product.id}`;
    if (Number(count[0].total) >= 8) return NextResponse.json({ error: "Maximum 8 photos par produit." }, { status: 409 });
    const order = await sql`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM product_images WHERE product_id = ${product.id}`;
    const rows = await sql`INSERT INTO product_images (product_id, image_url, alt_text, sort_order) VALUES (${product.id}, ${imageUrl}, ${altText}, ${Number(order[0].next)}) RETURNING id, image_url, alt_text, sort_order`;
    return NextResponse.json({ image: rows[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Échec de l'enregistrement de la photo" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;
  try {
    const { imageId, direction } = await request.json();
    if (!imageId || !["up", "down"].includes(direction)) return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    const sql = neon(process.env.DATABASE_URL!);
    const products = await sql`SELECT id FROM products WHERE is_active = true ORDER BY created_at DESC LIMIT 1`;
    if (!products.length) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    const product = products[0];
    const rows = await sql`SELECT id, sort_order FROM product_images WHERE id = ${imageId} AND product_id = ${product.id}`;
    if (!rows.length) return NextResponse.json({ error: "Photo introuvable" }, { status: 404 });
    const current = rows[0];
    const neighbor = direction === "up"
      ? await sql`SELECT id, sort_order FROM product_images WHERE product_id = ${product.id} AND sort_order < ${current.sort_order} ORDER BY sort_order DESC LIMIT 1`
      : await sql`SELECT id, sort_order FROM product_images WHERE product_id = ${product.id} AND sort_order > ${current.sort_order} ORDER BY sort_order ASC LIMIT 1`;
    if (neighbor.length) {
      await sql`UPDATE product_images SET sort_order = ${neighbor[0].sort_order} WHERE id = ${current.id}`;
      await sql`UPDATE product_images SET sort_order = ${current.sort_order} WHERE id = ${neighbor[0].id}`;
    }
    const images = await sql`SELECT id, image_url, alt_text, sort_order FROM product_images WHERE product_id = ${product.id} ORDER BY sort_order, created_at`;
    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ error: "Impossible de réorganiser les photos" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;
  try {
    const { imageId } = await request.json();
    if (!imageId) return NextResponse.json({ error: "Photo invalide" }, { status: 400 });
    const sql = neon(process.env.DATABASE_URL!);
    const product = await getProduct(sql);
    if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    const rows = await sql`DELETE FROM product_images WHERE id = ${imageId} AND product_id = ${product.id} RETURNING id`;
    if (!rows.length) return NextResponse.json({ error: "Photo introuvable" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Impossible de supprimer la photo" }, { status: 500 });
  }
}
