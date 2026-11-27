import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
export const dynamic = "force-dynamic";
export async function GET() {
  const gate=await requireAdmin(); if(gate.response)return gate.response;
  try {
    const sql=neon(process.env.DATABASE_URL!);
    const rows=await sql`SELECT v.product_id,p.name AS product_name,v.color_name,MAX(v.color_hex) AS color_hex,MAX(v.color_image_url) AS color_image_url,COUNT(*)::int AS size_count FROM product_variants v JOIN products p ON p.id=v.product_id GROUP BY v.product_id,p.name,v.color_name ORDER BY p.name,v.color_name`;
    return NextResponse.json({colors:rows});
  } catch { return NextResponse.json({error:"Impossible de charger les couleurs."},{status:500}); }
}
export async function POST(request:NextRequest) {
  const gate=await requireAdmin(); if(gate.response)return gate.response;
  try {
    const body=await request.json();
    const productId=String(body.productId||""), color=String(body.colorName||"").trim(), image=String(body.imageUrl||"");
    if(!productId||!color||!/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(image)) return NextResponse.json({error:"Image ou variante invalide."},{status:400});
    if(image.length>1500000)return NextResponse.json({error:"Image trop volumineuse. Choisissez une photo plus légère."},{status:413});
    const sql=neon(process.env.DATABASE_URL!);
    const rows=await sql`UPDATE product_variants SET color_image_url=${image},updated_at=now() WHERE product_id=${productId}::uuid AND color_name=${color} RETURNING id`;
    if(!rows.length)return NextResponse.json({error:"Couleur introuvable pour ce produit."},{status:404});
    return NextResponse.json({success:true,updated:rows.length});
  } catch { return NextResponse.json({error:"Impossible d'enregistrer la photo."},{status:500}); }
}
