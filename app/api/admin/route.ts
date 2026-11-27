import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
export const dynamic = "force-dynamic";
export async function GET() {
  const authResult = await requireAdmin(); if (authResult.response) return authResult.response;
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const [variants, orders] = await Promise.all([
      sql`SELECT v.id,v.product_id,p.name AS product_name,v.color_name,v.color_hex,v.size,v.stock_quantity FROM product_variants v JOIN products p ON p.id=v.product_id ORDER BY p.name,v.color_name,CASE v.size WHEN 'M' THEN 1 WHEN 'L' THEN 2 WHEN 'XL' THEN 3 WHEN 'XXL' THEN 4 ELSE 5 END`,
      sql`SELECT o.id,o.order_number,o.customer_name,o.phone,o.city,o.address,o.notes,o.status,o.subtotal,o.delivery_fee,o.total,o.created_at,i.product_name,i.color_name,i.size,i.quantity FROM orders o LEFT JOIN order_items i ON i.order_id=o.id ORDER BY o.created_at DESC LIMIT 100`
    ]);
    return NextResponse.json({ variants, orders });
  } catch { return NextResponse.json({ error: "Erreur de lecture du tableau de bord" }, { status: 500 }); }
}
export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin(); if (authResult.response) return authResult.response;
  try {
    const body = await request.json(), sql = neon(process.env.DATABASE_URL!);
    if (body.action === "stock") {
      const quantity = Number(body.stock);
      if (!body.variantId || !Number.isInteger(quantity) || quantity < 0) return NextResponse.json({ error: "Stock invalide" }, { status: 400 });
      const rows = await sql`UPDATE product_variants SET stock_quantity=${quantity},updated_at=now() WHERE id=${body.variantId} RETURNING id`;
      if (!rows.length) return NextResponse.json({ error: "Variante introuvable" }, { status: 404 });
      return NextResponse.json({ success: true });
    }
    if (body.action === "status") {
      const allowed = ["pending","confirmed","preparing","shipped","delivered","cancelled"];
      if (!allowed.includes(body.status) || !body.orderId) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
      if (body.status === "cancelled") {
        const result = await sql`SELECT public.cancel_store_order(${body.orderId}::uuid) AS success`;
        if (!result[0]?.success) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
        return NextResponse.json({ success: true });
      }
      const old = await sql`SELECT status FROM orders WHERE id=${body.orderId}`;
      if (!old.length) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
      if (old[0].status === "cancelled") return NextResponse.json({ error: "Une commande annulée ne peut pas être réactivée. Créez une nouvelle commande." }, { status: 409 });
      await sql`UPDATE orders SET status=${body.status},updated_at=now() WHERE id=${body.orderId}`;
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch { return NextResponse.json({ error: "Modification impossible" }, { status: 500 }); }
}